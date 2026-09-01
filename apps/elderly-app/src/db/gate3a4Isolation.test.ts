import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { db } from "./dexie";
import {
  enqueueSession,
  persistCompletedGameSession,
  persistQueuedGameSessionPair,
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

function mockActiveAuth(userId: string, token: string) {
  vi.spyOn(authStorage, "readUserId").mockReturnValue(userId);
  vi.spyOn(authStorage, "readAccessToken").mockReturnValue(token);
}

async function matchingOutbox(userId: string, clientId: string) {
  return db.outbox
    .where("userId")
    .equals(userId)
    .filter((item) => item.payload.clientGeneratedId === clientId)
    .toArray();
}

async function assertUnsyncedPair(userId: string, clientId: string) {
  const saved = await db.sessions.where("clientGeneratedId").equals(clientId).first();
  expect(saved).toBeDefined();
  expect(saved?.userId).toBe(userId);
  expect(saved?.synced).toBe(0);
  const outbox = await matchingOutbox(userId, clientId);
  expect(outbox).toHaveLength(1);
}

describe("Gate 3A.4 atomic game-session outbox and auth binding", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { onLine: true });
    mockActiveAuth(USER_A, TOKEN_A);
  });

  it("never posts User A session with User B active token", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mockActiveAuth(USER_B, TOKEN_B);
    const session = sessionRow(USER_A, "client-cross-user");

    const outcome = await persistCompletedGameSession(session, TOKEN_B);

    expect(outcome).toBe("queued");
    expect(fetchMock).not.toHaveBeenCalled();
    await assertUnsyncedPair(USER_A, "client-cross-user");
  });

  it("skips direct fetch on token mismatch and leaves User A queued", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mockActiveAuth(USER_A, TOKEN_B);
    const session = sessionRow(USER_A, "client-token-mismatch");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    expect(fetchMock).not.toHaveBeenCalled();
    await assertUnsyncedPair(USER_A, "client-token-mismatch");
  });

  it("leaves session unsynced and queued when account switches during successful fetch", async () => {
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_A);
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue(TOKEN_A);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_B);
        return { ok: true, status: 200 };
      }),
    );
    const session = sessionRow(USER_A, "client-switch");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    await assertUnsyncedPair(USER_A, "client-switch");
  });

  it("rolls back session write when outbox insertion fails", async () => {
    const session = sessionRow(USER_A, "client-outbox-fail");
    const realAdd = db.outbox.add.bind(db.outbox);
    vi.spyOn(db.outbox, "add").mockImplementation(async (item, key) => {
      if (item.kind === "game_session") {
        throw new Error("outbox write failed");
      }
      return realAdd(item, key);
    });

    await expect(persistQueuedGameSessionPair(session)).rejects.toThrow("outbox write failed");
    expect(await db.sessions.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
  });

  it("rolls back outbox write when session insertion fails", async () => {
    const session = sessionRow(USER_A, "client-session-fail");
    vi.spyOn(db.sessions, "add").mockImplementationOnce(async () => {
      throw new Error("session write failed");
    });

    await expect(persistQueuedGameSessionPair(session)).rejects.toThrow("session write failed");
    expect(await db.sessions.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
  });

  it("never commits an unsynced session without one matching outbox row", async () => {
    const session = sessionRow(USER_A, "client-invariant");
    await persistQueuedGameSessionPair(session);

    const saved = await db.sessions.where("clientGeneratedId").equals("client-invariant").first();
    expect(saved?.synced).toBe(0);
    expect(await matchingOutbox(USER_A, "client-invariant")).toHaveLength(1);

    const unsyncedSessions = await db.sessions.filter((row) => row.synced === 0).toArray();
    for (const row of unsyncedSessions) {
      const outbox = await matchingOutbox(row.userId, row.clientGeneratedId);
      expect(outbox).toHaveLength(1);
    }
  });

  it("deduplicates two concurrent enqueueSession calls into one row", async () => {
    const session = sessionRow(USER_A, "client-concurrent-enqueue");
    await Promise.all([enqueueSession(session), enqueueSession(session)]);
    expect(await matchingOutbox(USER_A, "client-concurrent-enqueue")).toHaveLength(1);
  });

  it("deduplicates concurrent persistCompletedGameSession calls for the same id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const session = sessionRow(USER_A, "client-concurrent-persist");
    await Promise.all([
      persistCompletedGameSession(session, TOKEN_A),
      persistCompletedGameSession(session, TOKEN_A),
    ]);
    expect(await db.sessions.where("clientGeneratedId").equals("client-concurrent-persist").count()).toBe(1);
    expect(await matchingOutbox(USER_A, "client-concurrent-persist")).toHaveLength(1);
  });

  it("marks synced and removes outbox atomically on direct 2xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));
    const session = sessionRow(USER_A, "client-atomic-success");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("saved");
    const saved = await db.sessions.where("clientGeneratedId").equals("client-atomic-success").first();
    expect(saved?.synced).toBe(1);
    expect(await matchingOutbox(USER_A, "client-atomic-success")).toHaveLength(0);
  });

  it("preserves the unsynced pair on 409 failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409 })));
    const session = sessionRow(USER_A, "client-409-pair");

    expect(await persistCompletedGameSession(session, TOKEN_A)).toBe("queued");
    await assertUnsyncedPair(USER_A, "client-409-pair");
  });

  it("preserves the unsynced pair on 500 failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const session = sessionRow(USER_A, "client-500-pair");

    expect(await persistCompletedGameSession(session, TOKEN_A)).toBe("queued");
    await assertUnsyncedPair(USER_A, "client-500-pair");
  });

  it("preserves the unsynced pair on network exception", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const session = sessionRow(USER_A, "client-net-pair");

    expect(await persistCompletedGameSession(session, TOKEN_A)).toBe("queued");
    await assertUnsyncedPair(USER_A, "client-net-pair");
  });

  it("keeps a replayable queued pair when server accepted but cleanup did not run", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));
    const session = sessionRow(USER_A, "client-crash-after-server");
    const realMark = db.transaction.bind(db);
    let transactionCalls = 0;
    vi.spyOn(db, "transaction").mockImplementation((...args: unknown[]) => {
      transactionCalls += 1;
      if (transactionCalls === 2) {
        throw new Error("cleanup interrupted");
      }
      return realMark(...(args as Parameters<typeof db.transaction>));
    });

    const outcome = await persistCompletedGameSession(session, TOKEN_A);
    expect(outcome).toBe("queued");
    await assertUnsyncedPair(USER_A, "client-crash-after-server");
  });
});
