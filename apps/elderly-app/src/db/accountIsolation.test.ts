import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { db } from "./dexie";
import {
  enqueueReminderAck,
  enqueueSession,
  failedOutboxCount,
  flushOutbox,
  pendingOutboxCount,
  recentSessionsForGame,
} from "./syncOutbox";
import { loadRemindersFromCache, syncReminders } from "../api/reminders";
import { pullServerChanges } from "./syncPull";
import * as syncStatus from "../api/syncStatus";
import * as authStorage from "../lib/authStorage";
import { readStoredNextSince } from "../lib/syncWatermark";

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

describe("account isolation with Dexie", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubGlobal("navigator", { onLine: true });
  });

  it("does not flush user A outbox entries when flushing as user B", async () => {
    await enqueueSession(sessionRow(USER_A, "client-a"));
    await enqueueSession(sessionRow(USER_B, "client-b"));

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_B);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [{ index: 0, status: "ok" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const flushed = await flushOutbox(TOKEN_B, USER_B);
    expect(flushed).toBe(1);
    expect(await pendingOutboxCount(USER_A)).toBe(1);
    expect(await pendingOutboxCount(USER_B)).toBe(0);
  });

  it("keeps user B entries untouched when flushing user A", async () => {
    await enqueueSession(sessionRow(USER_A, "client-a"));
    await enqueueSession(sessionRow(USER_B, "client-b"));

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ results: [{ index: 0, status: "ok" }] }),
      })),
    );

    await flushOutbox(TOKEN_A, USER_A);
    expect(await pendingOutboxCount(USER_B)).toBe(1);
  });

  it("scopes pending and failed counts to the current user", async () => {
    await db.outbox.add({
      kind: "reminder_ack",
      userId: USER_A,
      payload: { reminderId: "r1", userId: USER_A, acknowledgedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      attempts: 8,
    });
    await db.outbox.add({
      kind: "reminder_ack",
      userId: USER_B,
      payload: { reminderId: "r2", userId: USER_B, acknowledgedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    expect(await pendingOutboxCount(USER_A)).toBe(1);
    expect(await pendingOutboxCount(USER_B)).toBe(1);
    expect(await failedOutboxCount(USER_A)).toBe(1);
    expect(await failedOutboxCount(USER_B)).toBe(0);
  });

  it("returns recent sessions only for the requested user", async () => {
    await db.sessions.add(sessionRow(USER_A, "a1"));
    await db.sessions.add(sessionRow(USER_B, "b1"));

    const rows = await recentSessionsForGame("memory_match", USER_A);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(USER_A);
  });

  it("reads reminder cache only for the current user", async () => {
    await db.reminders.bulkPut([
      {
        id: "r-a",
        userId: USER_A,
        type: "medicine",
        title: "A",
        scheduledTime: "2026-01-01T08:00:00.000Z",
        timeLabel: "8:00",
        done: 0,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "r-b",
        userId: USER_B,
        type: "medicine",
        title: "B",
        scheduledTime: "2026-01-01T09:00:00.000Z",
        timeLabel: "9:00",
        done: 0,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    const rows = await loadRemindersFromCache("en");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(USER_A);
  });

  it("full reminder refresh does not erase another user cached reminders", async () => {
    await db.reminders.bulkPut([
      {
        id: "keep-b",
        userId: USER_B,
        type: "medicine",
        title: "Keep B",
        scheduledTime: "2026-01-01T09:00:00.000Z",
        timeLabel: "9:00",
        done: 0,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: "r-a",
            type: "medicine",
            title: { en: "A" },
            scheduled_time: "2026-01-01T08:00:00.000Z",
            last_acknowledged_at: null,
            is_active: true,
            updated_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      })),
    );

    await syncReminders("en");
    const userBRows = await db.reminders.where("userId").equals(USER_B).toArray();
    expect(userBRows).toHaveLength(1);
    expect(userBRows[0]?.title).toBe("Keep B");
  });

  it("preserves pending acknowledgement only for the same user outbox item", async () => {
    await db.reminders.put({
      id: "r1",
      userId: USER_A,
      type: "medicine",
      title: "Med",
      scheduledTime: "2026-01-01T08:00:00.000Z",
      timeLabel: "8:00",
      done: 1,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    await enqueueReminderAck("r1", USER_A);
    await enqueueReminderAck("r1", USER_B);

    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-03T00:00:00.000Z",
      reminders: [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Med" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-03T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [],
    });
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);

    await pullServerChanges(TOKEN_A, USER_A, "en");
    expect((await db.reminders.get("r1"))?.done).toBe(1);
  });

  it("aborts pull merge and cursor advance when account changes before merge", async () => {
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-04T00:00:00.000Z",
      reminders: [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Med" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-02T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [],
    });
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_B);

    const result = await pullServerChanges(TOKEN_A, USER_A, "en");
    expect(result).toBeNull();
    expect(readStoredNextSince(USER_A)).toBeNull();
    expect(await db.reminders.get("r1")).toBeUndefined();
  });

  it("rolls back pull writes when account changes during transaction", async () => {
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-04T00:00:00.000Z",
      reminders: [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Med" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-02T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [
        {
          id: "m1",
          media_url: "/a.jpg",
          title: { en: "Photo" },
          category: "family",
          created_at: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    let callCount = 0;
    vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
      callCount += 1;
      return callCount <= 2 ? USER_A : USER_B;
    });
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);

    const eventSpy = vi.fn();
    window.addEventListener("smriti:server-pull-complete", eventSpy);

    const result = await pullServerChanges(TOKEN_A, USER_A, "en");
    expect(result).toBeNull();
    expect(await db.reminders.get("r1")).toBeUndefined();
    expect(await db.memoryItems.get("m1")).toBeUndefined();
    expect(readStoredNextSince(USER_A)).toBeNull();
    expect(eventSpy).not.toHaveBeenCalled();
  });

  it("migrates legacy outbox ownership from payload and drops ownerless rows", async () => {
    await db.close();
    await Dexie.delete("smriti_elderly");

    const legacyDb = new Dexie("smriti_elderly");
    legacyDb.version(3).stores({
      sessions: "++id, clientGeneratedId, userId, gameType, playedAt, synced",
      outbox: "++id, kind, createdAt",
      reminders: "id, scheduledTime, updatedAt",
      paired: "id, phone",
      memoryItems: "id, userId, cachedAt",
    });
    await legacyDb.open();
    await legacyDb.table("outbox").add({
      kind: "game_session",
      payload: sessionRow(USER_A, "legacy-client"),
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await legacyDb.table("outbox").add({
      kind: "reminder_ack",
      payload: { reminderId: "r1", userId: "", acknowledgedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await legacyDb.table("reminders").add({
      id: "legacy-reminder",
      type: "medicine",
      title: "Legacy",
      scheduledTime: "2026-01-01T08:00:00.000Z",
      timeLabel: "8:00",
      done: 0,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await legacyDb.close();

    await db.open();
    const migrated = await db.outbox.toArray();
    expect(migrated).toHaveLength(1);
    expect(migrated[0]?.userId).toBe(USER_A);
    expect(await db.reminders.get("legacy-reminder")).toBeUndefined();
  });
});
