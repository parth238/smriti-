import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { db } from "./dexie";
import { enqueueSession, persistCompletedGameSession, postGameSession } from "./syncOutbox";
import * as authStorage from "../lib/authStorage";

const USER_A = "user-a";
const TOKEN_A = "token-a";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

function mockActiveAuth(userId: string, token: string) {
  vi.spyOn(authStorage, "readUserId").mockReturnValue(userId);
  vi.spyOn(authStorage, "readAccessToken").mockReturnValue(token);
}

function sessionRow(clientId: string) {
  return {
    clientGeneratedId: clientId,
    userId: USER_A,
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

function gameSessionSourceFiles(): string[] {
  return [
    join(APP_ROOT, "hooks/useGameSession.ts"),
    join(APP_ROOT, "db/syncOutbox.ts"),
  ];
}

describe("game session save and upload", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { onLine: true });
    mockActiveAuth(USER_A, TOKEN_A);
  });

  it("direct 200 saves a synced session and leaves no duplicate outbox row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));
    const session = sessionRow("client-200");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("saved");
    const saved = await db.sessions.where("clientGeneratedId").equals("client-200").first();
    expect(saved?.synced).toBe(1);
    expect(await db.outbox.count()).toBe(0);
  });

  it("direct 409 saves an unsynced session and queues exactly one retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409 })));
    const session = sessionRow("client-409");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    const saved = await db.sessions.where("clientGeneratedId").equals("client-409").first();
    expect(saved?.synced).toBe(0);
    const outbox = await db.outbox.where("userId").equals(USER_A).toArray();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.payload.clientGeneratedId).toBe("client-409");
  });

  it("direct 500 saves an unsynced session and queues exactly one retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const session = sessionRow("client-500");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    expect((await db.sessions.where("clientGeneratedId").equals("client-500").first())?.synced).toBe(0);
    expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);
  });

  it("network exception saves an unsynced session and queues exactly one retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    const session = sessionRow("client-net");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    expect((await db.sessions.where("clientGeneratedId").equals("client-net").first())?.synced).toBe(0);
    expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);
  });

  it("repeating the failure path does not duplicate the same clientGeneratedId in the outbox", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409 })));
    const session = sessionRow("client-dup");

    await persistCompletedGameSession(session, TOKEN_A);
    await persistCompletedGameSession(session, TOKEN_A);

    const outbox = await db.outbox
      .where("userId")
      .equals(USER_A)
      .filter((item) => item.payload.clientGeneratedId === "client-dup")
      .toArray();
    expect(outbox).toHaveLength(1);
  });

  it("offline completion still saves locally and queues once", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { onLine: false });
    const session = sessionRow("client-offline");

    const outcome = await persistCompletedGameSession(session, TOKEN_A);

    expect(outcome).toBe("queued");
    const saved = await db.sessions.where("clientGeneratedId").equals("client-offline").first();
    expect(saved).toBeDefined();
    expect(saved?.synced).toBe(0);
    expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("postGameSession returns false for 409", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 409 })));
    const ok = await postGameSession(sessionRow("client-post"), TOKEN_A);
    expect(ok).toBe(false);
  });

  it("enqueueSession is idempotent for the same clientGeneratedId", async () => {
    const session = sessionRow("client-enqueue");
    await enqueueSession(session);
    await enqueueSession(session);
    expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);
  });

  it("confirms no elderly-app game-session path treats 409 as success", () => {
    const forbidden = /response\.ok\s*\|\|\s*response\.status\s*===\s*409/;
    for (const file of gameSessionSourceFiles()) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(forbidden);
      if (source.includes("409")) {
        expect(source).not.toMatch(/status\s*===\s*409[\s\S]{0,80}(saved|success|synced)/i);
      }
    }
    const repoMatches = [
      join(APP_ROOT, "hooks/useGameSession.ts"),
      join(APP_ROOT, "db/syncOutbox.ts"),
      join(APP_ROOT, "db/gate3a2Isolation.test.ts"),
    ];
    for (const file of repoMatches) {
      const source = readFileSync(file, "utf8");
      if (file.endsWith("gate3a2Isolation.test.ts")) {
        expect(source).toContain("status: 409");
        expect(source).not.toMatch(forbidden);
        continue;
      }
      expect(source).not.toMatch(forbidden);
    }
  });
});
