import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { acknowledgeReminder, syncReminders } from "../api/reminders";
import { db } from "./dexie";
import {
  buildDemoReminderId,
  buildSeedReminders,
  ensureSeedReminders,
  isDemoReminderId,
} from "./reminderSeed";
import {
  OUTBOX_QUARANTINE_ATTEMPTS,
  flushOutbox,
  isOutboxOwnershipConsistent,
  saveLocalSession,
} from "./syncOutbox";
import * as authStorage from "../lib/authStorage";
import { bumpAuthLoadGeneration } from "../lib/authLoadGeneration";
import { isAuthScopedSnapshotCurrent, captureAuthScopedSnapshot } from "../lib/authLoadScope";

const USER_A = "user-a";
const USER_B = "user-b";
const TOKEN_A = "token-a";
const TOKEN_B = "token-b";

function sessionRow(userId: string, clientId: string) {
  return {
    clientGeneratedId: clientId,
    userId,
    gameType: "memory_match",
    difficulty: 3,
    accuracy: 80,
    reactionTimeMs: 900,
    errors: 0,
    hintsUsed: 0,
    sessionDurationSec: 120,
    completedOrQuit: "completed" as const,
    playedAt: new Date().toISOString(),
    synced: 0,
  };
}

describe("Gate 3A.1 adversarial isolation", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubGlobal("navigator", { onLine: true });
  });

  it("keeps per-user demo reminders isolated", async () => {
    const seedsA = await ensureSeedReminders("en", USER_A);
    const seedsB = await ensureSeedReminders("en", USER_B);

    expect(seedsA).toHaveLength(2);
    expect(seedsB).toHaveLength(2);
    expect(seedsA[0]?.id).not.toBe(seedsB[0]?.id);
    expect(isDemoReminderId(seedsA[0]!.id)).toBe(true);

    const demoId = buildDemoReminderId(USER_A, "water");
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    await acknowledgeReminder(demoId, "en");

    const userARow = await db.reminders.get(demoId);
    const userBRow = await db.reminders.get(buildDemoReminderId(USER_B, "water"));
    expect(userARow?.done).toBe(1);
    expect(userBRow?.done).toBe(0);
  });

  it("never sends contradictory game-session outbox rows", async () => {
    const rowId = await db.outbox.add({
      kind: "game_session",
      userId: USER_B,
      payload: sessionRow(USER_A, "client-a"),
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    const row = await db.outbox.get(rowId);
    expect(row).toBeDefined();
    expect(isOutboxOwnershipConsistent(row!, USER_B)).toBe(false);

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_B);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const flushed = await flushOutbox(TOKEN_B, USER_B);
    expect(flushed).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    const quarantined = await db.outbox.get(rowId);
    expect(quarantined?.attempts).toBe(OUTBOX_QUARANTINE_ATTEMPTS);
  });

  it("never sends contradictory reminder-ack outbox rows", async () => {
    const rowId = await db.outbox.add({
      kind: "reminder_ack",
      userId: USER_B,
      payload: {
        reminderId: "r1",
        userId: USER_A,
        acknowledgedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_B);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await flushOutbox(TOKEN_B, USER_B);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await db.outbox.get(rowId))?.attempts).toBe(OUTBOX_QUARANTINE_ATTEMPTS);
  });

  it("still flushes valid rows when contradictory rows are quarantined", async () => {
    const badId = await db.outbox.add({
      kind: "game_session",
      userId: USER_B,
      payload: sessionRow(USER_A, "bad"),
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await db.outbox.add({
      kind: "game_session",
      userId: USER_B,
      payload: sessionRow(USER_B, "good"),
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_B);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ results: [{ index: 0, status: "ok" }] }),
      })),
    );

    const flushed = await flushOutbox(TOKEN_B, USER_B);
    expect(flushed).toBe(1);
    expect((await db.outbox.get(badId))?.attempts).toBe(OUTBOX_QUARANTINE_ATTEMPTS);
  });

  it("does not update another user session on matching clientGeneratedId", async () => {
    await db.sessions.add(sessionRow(USER_A, "shared-client"));
    await saveLocalSession({ ...sessionRow(USER_B, "shared-client"), accuracy: 42 });
    const row = await db.sessions.where("clientGeneratedId").equals("shared-client").first();
    expect(row?.userId).toBe(USER_A);
    expect(row?.accuracy).toBe(80);
  });

  it("rejects foreign reminder acknowledgement", async () => {
    const foreignId = buildDemoReminderId(USER_B, "water");
    await db.reminders.bulkPut(buildSeedReminders("en", USER_B));
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    const rows = await acknowledgeReminder(foreignId, "en");
    expect(rows.every((row) => row.userId === USER_A)).toBe(true);
    expect((await db.reminders.get(foreignId))?.done).toBe(0);
  });

  it("does not acknowledge when logged out", async () => {
    const demoId = buildDemoReminderId(USER_A, "water");
    await db.reminders.bulkPut(buildSeedReminders("en", USER_A));
    vi.spyOn(authStorage, "readUserId").mockReturnValue(null);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(null);
    const rows = await acknowledgeReminder(demoId, "en");
    expect(rows).toEqual([]);
    expect((await db.reminders.get(demoId))?.done).toBe(0);
  });

  it("does not mutate cache after account switch during online acknowledgement", async () => {
    const serverId = "server-reminder-1";
    await db.reminders.put({
      id: serverId,
      userId: USER_A,
      type: "medicine",
      title: "Med",
      scheduledTime: new Date().toISOString(),
      timeLabel: "Morning",
      done: 0,
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(authStorage, "readUserId")
      .mockReturnValueOnce(USER_A)
      .mockReturnValueOnce(USER_A)
      .mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken")
      .mockReturnValueOnce(TOKEN_A)
      .mockReturnValueOnce(TOKEN_A)
      .mockReturnValue(TOKEN_B);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
        return { ok: true };
      }),
    );

    const rows = await acknowledgeReminder(serverId, "en");
    expect(rows.every((row) => row.userId === USER_B)).toBe(true);
    expect((await db.reminders.get(serverId))?.done).toBe(0);
    expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(0);
  });

  it("aborts full refresh on account switch without deleting other users", async () => {
    await db.reminders.bulkPut([
      ...buildSeedReminders("en", USER_A),
      ...buildSeedReminders("en", USER_B),
    ]);

    vi.spyOn(authStorage, "readUserId")
      .mockReturnValueOnce(USER_A)
      .mockReturnValueOnce(USER_A)
      .mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken")
      .mockReturnValueOnce(TOKEN_A)
      .mockReturnValueOnce(TOKEN_A)
      .mockReturnValue(TOKEN_B);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: "server-r1",
            type: "medicine",
            title: { en: "Server" },
            scheduled_time: "2026-01-01T08:00:00.000Z",
            last_acknowledged_at: null,
            is_active: true,
            updated_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      })),
    );

    const rows = await syncReminders("en");
    expect(rows.every((row) => row.userId === USER_B)).toBe(true);
    expect(await db.reminders.where("userId").equals(USER_B).count()).toBe(2);
    expect(await db.reminders.where("userId").equals(USER_A).count()).toBe(2);
    expect(await db.reminders.get("server-r1")).toBeUndefined();
  });

  it("invalidates stale auth-scoped loads after generation bump", async () => {
    const snapshot = captureAuthScopedSnapshot();
    bumpAuthLoadGeneration();
    expect(isAuthScopedSnapshotCurrent(snapshot)).toBe(false);
  });
});
