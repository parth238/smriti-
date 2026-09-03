import { beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { db } from "./dexie";
import {
  buildGameSessionApiPayload,
  flushOutbox,
  persistCompletedGameSession,
} from "./syncOutbox";
import * as authStorage from "../lib/authStorage";

const USER_A = "user-a";
const TOKEN_A = "token-a";

const CANONICAL_GAME_TYPES = [
  "memory_match",
  "attention_reaction",
  "sequencing",
  "picture_naming",
  "simple_arithmetic",
  "path_maze",
  "face_recall",
] as const;

/** Original four games whose Alembic rows use legacy UUIDs. */
const LEGACY_MIGRATION_GAME_TYPES = [
  "memory_match",
  "attention_reaction",
  "sequencing",
  "picture_naming",
] as const;

function mockActiveAuth(userId: string, token: string) {
  vi.spyOn(authStorage, "readUserId").mockReturnValue(userId);
  vi.spyOn(authStorage, "readAccessToken").mockReturnValue(token);
  vi.spyOn(authStorage, "deviceId").mockReturnValue("test-device");
}

function sessionRow(clientId: string, gameType: string) {
  return {
    clientGeneratedId: clientId,
    userId: USER_A,
    gameType,
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

function parseBody(init?: RequestInit): Record<string, unknown> {
  const raw = init?.body;
  expect(typeof raw).toBe("string");
  return JSON.parse(raw as string) as Record<string, unknown>;
}

describe("game session API payloads use game_type only", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.restoreAllMocks();
    vi.stubGlobal("navigator", { onLine: true });
    mockActiveAuth(USER_A, TOKEN_A);
  });

  it("buildGameSessionApiPayload omits game_id for every canonical type", () => {
    for (const gameType of CANONICAL_GAME_TYPES) {
      const payload = buildGameSessionApiPayload(sessionRow(`client-${gameType}`, gameType));
      expect(payload.game_type).toBe(gameType);
      expect(Object.prototype.hasOwnProperty.call(payload, "game_id")).toBe(false);
      expect(JSON.stringify(payload)).not.toContain("game_id");
      expect(payload.client_generated_id).toBe(`client-${gameType}`);
    }
  });

  it.each([...CANONICAL_GAME_TYPES])(
    "direct online save for %s sends game_type and no game_id",
    async (gameType) => {
      const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      const clientId = `direct-${gameType}`;
      const session = sessionRow(clientId, gameType);

      const outcome = await persistCompletedGameSession(session, TOKEN_A);

      expect(outcome).toBe("saved");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const body = parseBody(init);
      expect(body.game_type).toBe(gameType);
      expect(Object.prototype.hasOwnProperty.call(body, "game_id")).toBe(false);
      expect(JSON.stringify(body)).not.toContain("game_id");
      expect(body.client_generated_id).toBe(clientId);

      const saved = await db.sessions.where("clientGeneratedId").equals(clientId).first();
      expect(saved?.synced).toBe(1);
      expect(await db.outbox.count()).toBe(0);
    },
  );

  it.each([...LEGACY_MIGRATION_GAME_TYPES])(
    "direct failure for legacy type %s keeps exactly one outbox row",
    async (gameType) => {
      vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
      const clientId = `fail-${gameType}`;
      const outcome = await persistCompletedGameSession(sessionRow(clientId, gameType), TOKEN_A);
      expect(outcome).toBe("queued");
      expect((await db.sessions.where("clientGeneratedId").equals(clientId).first())?.synced).toBe(0);
      expect(await db.outbox.where("userId").equals(USER_A).count()).toBe(1);
    },
  );

  it.each([...CANONICAL_GAME_TYPES])(
    "outbox batch flush for %s sends game_type and no game_id",
    async (gameType) => {
      const clientId = `batch-${gameType}`;
      await persistCompletedGameSession(sessionRow(clientId, gameType), null);
      expect(await db.outbox.count()).toBe(1);

      const fetchMock = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ results: [{ index: 0, status: "ok" }] }),
      }));
      vi.stubGlobal("fetch", fetchMock);

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(1);
      expect(fetchMock).toHaveBeenCalled();
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/sync/batch");
      const body = parseBody(init);
      const item = (body.items as Array<{ type: string; payload: Record<string, unknown> }>)[0];
      expect(item.type).toBe("game_session");
      expect(item.payload.game_type).toBe(gameType);
      expect(Object.prototype.hasOwnProperty.call(item.payload, "game_id")).toBe(false);
      expect(JSON.stringify(item.payload)).not.toContain("game_id");
      expect(item.payload.client_generated_id).toBe(clientId);
      expect(await db.outbox.count()).toBe(0);
    },
  );

  it.each([...LEGACY_MIGRATION_GAME_TYPES])(
    "failed batch flush for legacy type %s keeps the retryable outbox row",
    async (gameType) => {
      const clientId = `batch-fail-${gameType}`;
      await persistCompletedGameSession(sessionRow(clientId, gameType), null);

      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => ({ results: [{ index: 0, status: "error" }] }),
        })),
      );

      const flushed = await flushOutbox(TOKEN_A, USER_A);
      expect(flushed).toBe(0);
      const outbox = await db.outbox.where("userId").equals(USER_A).toArray();
      expect(outbox).toHaveLength(1);
      expect(outbox[0]?.payload.clientGeneratedId).toBe(clientId);
      expect(outbox[0]?.attempts).toBeGreaterThanOrEqual(1);
    },
  );
});
