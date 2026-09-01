import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { acknowledgeReminder } from "../api/reminders";
import { API_BASE } from "../api/auth";
import { db } from "./dexie";
import {
  buildDemoReminderId,
  buildSeedReminders,
} from "./reminderSeed";
import {
  OUTBOX_QUARANTINE_ATTEMPTS,
  enqueueSession,
  flushOutbox,
  isOutboxOwnershipConsistent,
} from "./syncOutbox";
import * as authStorage from "../lib/authStorage";

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

function mockActiveSession(userId: string, token: string) {
  vi.spyOn(authStorage, "readUserId").mockReturnValue(userId);
  vi.spyOn(authStorage, "readAccessToken").mockReturnValue(token);
}

function batchUnavailableFetch(
  gameSessionHandler: () => Promise<{ ok: boolean; status: number }>,
): ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string) => {
    if (url.includes("/sync/batch")) {
      throw new Error("batch unavailable");
    }
    if (url.includes("/game-sessions")) {
      return gameSessionHandler();
    }
    return { ok: false, status: 404 };
  });
}

describe("Gate 3A.2 fallback and session races", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    localStorage.clear();
    vi.stubGlobal("navigator", { onLine: true });
  });

  describe("direct game-session fallback after batch failure", () => {
    it("succeeds on direct 200, marks session synced and deletes outbox row", async () => {
      await enqueueSession(sessionRow(USER_A, "client-200"));
      mockActiveSession(USER_A, TOKEN_A);
      vi.stubGlobal("fetch", batchUnavailableFetch(async () => ({ ok: true, status: 200 })));

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(1);
      expect(await db.outbox.count()).toBe(0);
      const saved = await db.sessions.where("clientGeneratedId").equals("client-200").first();
      expect(saved?.synced).toBe(1);
    });

    it("keeps outbox row and increments attempts on direct 409", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_A,
        payload: sessionRow(USER_A, "client-409"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      mockActiveSession(USER_A, TOKEN_A);
      vi.stubGlobal("fetch", batchUnavailableFetch(async () => ({ ok: false, status: 409 })));

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      const row = await db.outbox.get(rowId);
      expect(row).toBeDefined();
      expect(row?.attempts).toBe(1);
      const saved = await db.sessions.where("clientGeneratedId").equals("client-409").first();
      expect(saved).toBeUndefined();
    });

    it("keeps outbox row and increments attempts on direct 500", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_A,
        payload: sessionRow(USER_A, "client-500"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      mockActiveSession(USER_A, TOKEN_A);
      vi.stubGlobal("fetch", batchUnavailableFetch(async () => ({ ok: false, status: 500 })));

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      expect((await db.outbox.get(rowId))?.attempts).toBe(1);
    });

    it("increments attempts when direct fallback throws", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_A,
        payload: sessionRow(USER_A, "client-net"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      mockActiveSession(USER_A, TOKEN_A);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/sync/batch")) {
            throw new Error("batch unavailable");
          }
          if (url.includes("/game-sessions")) {
            throw new Error("network down");
          }
          return { ok: false, status: 404 };
        }),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      expect((await db.outbox.get(rowId))?.attempts).toBe(1);
    });
  });

  describe("session abort vs quarantine", () => {
    it("leaves a valid item pending when the account changes after a successful batch response", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_A,
        payload: sessionRow(USER_A, "client-batch-ok"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      let sessionChecks = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        sessionChecks += 1;
        return sessionChecks <= 3 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/sync/batch")) {
            return {
              ok: true,
              json: async () => ({ results: [{ index: 0, status: "ok" }] }),
            };
          }
          return { ok: false, status: 404 };
        }),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      const row = await db.outbox.get(rowId);
      expect(row).toBeDefined();
      expect(row?.attempts).toBe(0);
      expect(row?.attempts).toBeLessThan(OUTBOX_QUARANTINE_ATTEMPTS);
    });

    it("leaves a valid item pending when the account changes after successful direct fallback", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_A,
        payload: sessionRow(USER_A, "client-direct-ok"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      let sessionChecks = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        sessionChecks += 1;
        return sessionChecks <= 3 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/sync/batch")) {
            throw new Error("batch unavailable");
          }
          if (url.includes("/game-sessions")) {
            return { ok: true, status: 200 };
          }
          return { ok: false, status: 404 };
        }),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      const row = await db.outbox.get(rowId);
      expect(row).toBeDefined();
      expect(row?.attempts).toBe(0);
    });

    it("leaves reminder-ack pending when the account changes after direct fallback response", async () => {
      const rowId = await db.outbox.add({
        kind: "reminder_ack",
        userId: USER_A,
        payload: {
          reminderId: "r1",
          userId: USER_A,
          acknowledgedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      let sessionChecks = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        sessionChecks += 1;
        return sessionChecks <= 3 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/sync/batch")) {
            throw new Error("batch unavailable");
          }
          if (url.includes("/reminders/")) {
            return { ok: true, status: 200 };
          }
          return { ok: false, status: 404 };
        }),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      expect(await db.outbox.get(rowId)).toBeDefined();
      expect((await db.outbox.get(rowId))?.attempts).toBe(0);
    });

    it("does not process remaining old-user items after the active account changes", async () => {
      await db.outbox.bulkAdd([
        {
          kind: "game_session",
          userId: USER_A,
          payload: sessionRow(USER_A, "client-first"),
          createdAt: "2026-01-01T00:00:00.000Z",
          attempts: 0,
        },
        {
          kind: "game_session",
          userId: USER_A,
          payload: sessionRow(USER_A, "client-second"),
          createdAt: "2026-01-01T00:00:01.000Z",
          attempts: 0,
        },
      ]);
      let sessionChecks = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        sessionChecks += 1;
        return sessionChecks <= 5 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url.includes("/sync/batch")) {
            return {
              ok: true,
              json: async () => ({
                results: [
                  { index: 0, status: "ok" },
                  { index: 1, status: "ok" },
                ],
              }),
            };
          }
          return { ok: false, status: 404 };
        }),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(1);
      const remaining = await db.outbox.where("userId").equals(USER_A).toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.payload.clientGeneratedId).toBe("client-second");
      expect(remaining[0]?.attempts).toBe(0);
    });

    it("still quarantines genuinely contradictory rows", async () => {
      const rowId = await db.outbox.add({
        kind: "game_session",
        userId: USER_B,
        payload: sessionRow(USER_A, "bad-client"),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      const row = await db.outbox.get(rowId);
      expect(isOutboxOwnershipConsistent(row!, USER_B)).toBe(false);
      mockActiveSession(USER_B, TOKEN_B);
      vi.stubGlobal("fetch", vi.fn());

      await flushOutbox(TOKEN_B, USER_B);
      expect((await db.outbox.get(rowId))?.attempts).toBe(OUTBOX_QUARANTINE_ATTEMPTS);
    });
  });

  describe("atomic session-guarded acknowledgement", () => {
    it("rolls back demo acknowledgement when the account switches after ownership read", async () => {
      const demoId = buildDemoReminderId(USER_A, "water");
      await db.reminders.bulkPut(buildSeedReminders("en", USER_A));
      let readCalls = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        readCalls += 1;
        return readCalls <= 2 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);

      await acknowledgeReminder(demoId, "en");
      expect((await db.reminders.get(demoId))?.done).toBe(0);
    });

    it("rolls back offline acknowledgement when the account switches during the transaction", async () => {
      const serverId = "server-offline";
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
      let readCalls = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        readCalls += 1;
        return readCalls <= 2 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(null);
      vi.stubGlobal("navigator", { onLine: false });

      await acknowledgeReminder(serverId, "en");
      expect((await db.reminders.get(serverId))?.done).toBe(0);
      expect(await db.outbox.count()).toBe(0);
    });

    it("does not update after online response when the account changed before local write", async () => {
      const serverId = "server-online";
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
      let readCalls = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        readCalls += 1;
        return readCalls <= 2 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));

      await acknowledgeReminder(serverId, "en");
      expect((await db.reminders.get(serverId))?.done).toBe(0);
      expect(await db.outbox.count()).toBe(0);
    });

    it("rolls back failure-path update and enqueue when the session changes during the transaction", async () => {
      const serverId = "server-fail";
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
      let readCalls = 0;
      vi.spyOn(authStorage, "readUserId").mockImplementation(() => {
        readCalls += 1;
        return readCalls <= 2 ? USER_A : USER_B;
      });
      vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
      vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));

      await acknowledgeReminder(serverId, "en");
      expect((await db.reminders.get(serverId))?.done).toBe(0);
      expect(await db.outbox.count()).toBe(0);
    });

    it("still acknowledges demo, offline and online paths for the active user", async () => {
      const demoId = buildDemoReminderId(USER_A, "water");
      await db.reminders.bulkPut(buildSeedReminders("en", USER_A));
      mockActiveSession(USER_A, TOKEN_A);
      await acknowledgeReminder(demoId, "en");
      expect((await db.reminders.get(demoId))?.done).toBe(1);

      const offlineId = "server-offline-ok";
      await db.reminders.put({
        id: offlineId,
        userId: USER_A,
        type: "medicine",
        title: "Med",
        scheduledTime: new Date().toISOString(),
        timeLabel: "Morning",
        done: 0,
        updatedAt: new Date().toISOString(),
      });
      vi.stubGlobal("navigator", { onLine: false });
      await acknowledgeReminder(offlineId, "en");
      expect((await db.reminders.get(offlineId))?.done).toBe(1);
      expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);

      const onlineId = "server-online-ok";
      await db.reminders.put({
        id: onlineId,
        userId: USER_A,
        type: "medicine",
        title: "Med",
        scheduledTime: new Date().toISOString(),
        timeLabel: "Morning",
        done: 0,
        updatedAt: new Date().toISOString(),
      });
      vi.stubGlobal("navigator", { onLine: true });
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          if (url === `${API_BASE}/reminders/${onlineId}/acknowledge`) {
            return { ok: true, status: 200 };
          }
          return { ok: false, status: 404 };
        }),
      );
      await acknowledgeReminder(onlineId, "en");
      expect((await db.reminders.get(onlineId))?.done).toBe(1);
    });
  });
});
