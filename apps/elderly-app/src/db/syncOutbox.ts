import { API_BASE } from "../api/auth";
import { GAME_IDS } from "../api/games";
import { deviceId, readUserId } from "../lib/authStorage";
import { assertActiveSession, sessionsMatch, SessionChangedError } from "../lib/sessionGuard";
import { db, type LocalGameSession, type OutboxItem } from "./dexie";

export const OUTBOX_QUARANTINE_ATTEMPTS = 99;

export function outboxPayloadOwnerId(item: OutboxItem): string | null {
  if (item.kind === "game_session") {
    return item.payload.userId || null;
  }
  return item.payload.userId || null;
}

export function isOutboxOwnershipConsistent(item: OutboxItem, activeUserId: string): boolean {
  const payloadOwnerId = outboxPayloadOwnerId(item);
  return !!payloadOwnerId && item.userId === payloadOwnerId && item.userId === activeUserId;
}

export function isOutboxQuarantined(item: OutboxItem): boolean {
  return item.attempts >= OUTBOX_QUARANTINE_ATTEMPTS;
}

export async function quarantineOutboxItem(itemId: number): Promise<void> {
  await db.outbox.update(itemId, { attempts: OUTBOX_QUARANTINE_ATTEMPTS });
}

function matchingGameSessionOutboxQuery(session: LocalGameSession) {
  return db.outbox
    .where("userId")
    .equals(session.userId)
    .filter(
      (item) =>
        item.kind === "game_session" &&
        item.payload.clientGeneratedId === session.clientGeneratedId,
    );
}

async function ensureGameSessionOutboxItem(session: LocalGameSession): Promise<void> {
  const existing = await matchingGameSessionOutboxQuery(session).first();
  if (existing) {
    return;
  }
  await db.outbox.add({
    kind: "game_session",
    userId: session.userId,
    payload: { ...session, synced: 0 },
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

async function upsertUnsyncedSession(session: LocalGameSession): Promise<void> {
  const unsynced: LocalGameSession = { ...session, synced: 0 };
  const existing = await db.sessions
    .where("clientGeneratedId")
    .equals(session.clientGeneratedId)
    .first();
  if (existing?.id != null) {
    if (existing.userId !== session.userId) {
      throw new SessionChangedError();
    }
    await db.sessions.update(existing.id, unsynced);
    return;
  }
  await db.sessions.add(unsynced);
}

export async function persistQueuedGameSessionPair(session: LocalGameSession): Promise<void> {
  const unsynced: LocalGameSession = { ...session, synced: 0 };
  await db.transaction("rw", [db.sessions, db.outbox], async () => {
    await upsertUnsyncedSession(unsynced);
    await ensureGameSessionOutboxItem(unsynced);
  });
}

async function markGameSessionSyncedAndRemoveOutbox(
  session: LocalGameSession,
  expectedUserId: string,
): Promise<void> {
  await db.transaction("rw", [db.sessions, db.outbox], async () => {
    const existing = await db.sessions
      .where("clientGeneratedId")
      .equals(session.clientGeneratedId)
      .first();
    if (!existing?.id || existing.userId !== expectedUserId) {
      throw new SessionChangedError();
    }
    await db.sessions.update(existing.id, { ...existing, synced: 1 });
    const outboxRow = await matchingGameSessionOutboxQuery(session).first();
    if (outboxRow?.id != null) {
      await db.outbox.delete(outboxRow.id);
    }
  });
}

function canDirectUploadGameSession(session: LocalGameSession, token: string | null): token is string {
  return (
    navigator.onLine &&
    !!token &&
    session.userId !== "local-demo-user" &&
    sessionsMatch(session.userId, token)
  );
}

export async function enqueueSession(session: LocalGameSession): Promise<void> {
  await db.transaction("rw", db.outbox, async () => {
    await ensureGameSessionOutboxItem({ ...session, synced: 0 });
  });
}

export async function enqueueReminderAck(reminderId: string, userId: string): Promise<void> {
  await db.outbox.add({
    kind: "reminder_ack",
    userId,
    payload: {
      reminderId,
      userId,
      acknowledgedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

export async function saveLocalSession(session: LocalGameSession): Promise<void> {
  const existing = await db.sessions
    .where("clientGeneratedId")
    .equals(session.clientGeneratedId)
    .first();
  if (existing?.id != null) {
    if (existing.userId !== session.userId) {
      return;
    }
    await db.sessions.update(existing.id, session);
    return;
  }
  await db.sessions.add(session);
}

export async function postGameSession(session: LocalGameSession, token: string): Promise<boolean> {
  const gameId = GAME_IDS[session.gameType];
  const response = await fetch(`${API_BASE}/game-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: session.userId,
      game_id: gameId ?? undefined,
      game_type: session.gameType,
      difficulty: session.difficulty,
      accuracy: session.accuracy,
      reaction_time_ms: session.reactionTimeMs,
      errors: session.errors,
      hints_used: session.hintsUsed,
      session_duration_sec: session.sessionDurationSec,
      completed_or_quit: session.completedOrQuit,
      client_generated_id: session.clientGeneratedId,
      played_at: session.playedAt,
    }),
  });
  return response.ok;
}

export async function persistCompletedGameSession(
  session: LocalGameSession,
  token: string | null,
): Promise<"saved" | "queued"> {
  const unsynced: LocalGameSession = { ...session, synced: 0 };
  await persistQueuedGameSessionPair(unsynced);

  if (!canDirectUploadGameSession(unsynced, token)) {
    return "queued";
  }

  try {
    if (await postGameSession(unsynced, token)) {
      if (!sessionsMatch(unsynced.userId, token)) {
        return "queued";
      }
      await markGameSessionSyncedAndRemoveOutbox(unsynced, unsynced.userId);
      return "saved";
    }
  } catch {
    // preserve the queued session/outbox pair for retry
  }
  return "queued";
}

async function postSession(session: LocalGameSession, token: string): Promise<boolean> {
  return postGameSession(session, token);
}

function outboxPayload(item: OutboxItem): { type: string; payload: Record<string, unknown> } {
  if (item.kind === "game_session") {
    const session = item.payload;
    return {
      type: "game_session",
      payload: {
        user_id: session.userId,
        game_id: GAME_IDS[session.gameType] ?? undefined,
        game_type: session.gameType,
        difficulty: session.difficulty,
        accuracy: session.accuracy,
        reaction_time_ms: session.reactionTimeMs,
        errors: session.errors,
        hints_used: session.hintsUsed,
        session_duration_sec: session.sessionDurationSec,
        completed_or_quit: session.completedOrQuit,
        client_generated_id: session.clientGeneratedId,
        played_at: session.playedAt,
      },
    };
  }
  return {
    type: "reminder_ack",
    payload: {
      reminder_id: item.payload.reminderId,
      acknowledged_at: item.payload.acknowledgedAt,
    },
  };
}

async function flushBatch(
  items: OutboxItem[],
  token: string,
  userId: string,
): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>();
  if (!items.length) {
    return results;
  }
  assertActiveSession(userId, token);
  try {
    const response = await fetch(`${API_BASE}/sync/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        device_id: deviceId(),
        items: items.map((item) => outboxPayload(item)),
      }),
    });
    if (response.ok) {
      const body = (await response.json()) as {
        results: Array<{ index: number; status: string }>;
      };
      for (const row of body.results) {
        results.set(row.index, row.status === "ok");
      }
      return results;
    }
  } catch {
    // fall through to per-item POST
  }
  return results;
}

export async function pendingOutboxCount(userId?: string | null): Promise<number> {
  const ownerId = userId ?? readUserId();
  if (!ownerId) {
    return 0;
  }
  return db.outbox
    .where("userId")
    .equals(ownerId)
    .filter((item) => !isOutboxQuarantined(item))
    .count();
}

export async function failedOutboxCount(userId?: string | null): Promise<number> {
  const ownerId = userId ?? readUserId();
  if (!ownerId) {
    return 0;
  }
  return db.outbox
    .where("userId")
    .equals(ownerId)
    .filter((item) => item.attempts >= 8)
    .count();
}

export async function flushOutbox(token: string | null, userId?: string | null): Promise<number> {
  const ownerId = userId ?? readUserId();
  if (!token || !ownerId || !navigator.onLine) {
    return 0;
  }
  assertActiveSession(ownerId, token);

  const candidates = await db.outbox.where("userId").equals(ownerId).sortBy("createdAt");
  if (!candidates.length) {
    return 0;
  }

  const validItems: OutboxItem[] = [];
  for (const item of candidates) {
    if (!item.id) {
      continue;
    }
    if (isOutboxQuarantined(item)) {
      continue;
    }
    if (!isOutboxOwnershipConsistent(item, ownerId)) {
      await quarantineOutboxItem(item.id);
      continue;
    }
    validItems.push(item);
  }

  if (!validItems.length) {
    return 0;
  }

  const batchResults = await flushBatch(validItems, token, ownerId);
  let flushed = 0;

  for (let index = 0; index < validItems.length; index += 1) {
    const item = validItems[index];
    if (!item.id) {
      continue;
    }
    if (!isOutboxOwnershipConsistent(item, ownerId)) {
      await quarantineOutboxItem(item.id);
      continue;
    }
    if (!assertActiveSessionSafe(ownerId, token)) {
      break;
    }
    if (item.attempts >= 8 && item.attempts < OUTBOX_QUARANTINE_ATTEMPTS) {
      await db.outbox.update(item.id, { attempts: 4 });
    }
    const batchOk = batchResults.get(index);
    try {
      let ok = false;
      if (batchOk === true) {
        if (!assertActiveSessionSafe(ownerId, token)) {
          break;
        }
        ok = true;
      } else if (batchOk === false) {
        ok = false;
      } else {
        if (!assertActiveSessionSafe(ownerId, token)) {
          break;
        }
        if (item.kind === "game_session") {
          ok = await postSession(item.payload, token);
        } else {
          const response = await fetch(`${API_BASE}/reminders/${item.payload.reminderId}/acknowledge`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          ok = response.ok;
        }
        if (!assertActiveSessionSafe(ownerId, token)) {
          break;
        }
      }
      if (!ok) {
        await db.outbox.update(item.id, { attempts: item.attempts + 1 });
        continue;
      }
      if (!assertActiveSessionSafe(ownerId, token)) {
        break;
      }
      if (item.kind === "game_session") {
        await saveLocalSession({ ...item.payload, synced: 1 });
      }
      await db.outbox.delete(item.id);
      flushed += 1;
    } catch {
      if (!assertActiveSessionSafe(ownerId, token)) {
        break;
      }
      await db.outbox.update(item.id, { attempts: item.attempts + 1 });
    }
  }
  return flushed;
}

function assertActiveSessionSafe(ownerId: string, token: string): boolean {
  try {
    assertActiveSession(ownerId, token);
    return true;
  } catch {
    return false;
  }
}

export async function recentSessionsForGame(
  gameType: string,
  userId?: string | null,
  limit = 12,
): Promise<LocalGameSession[]> {
  const ownerId = userId ?? readUserId();
  if (!ownerId) {
    return [];
  }
  const rows = await db.sessions.where("[userId+gameType]").equals([ownerId, gameType]).toArray();
  return rows.sort((a, b) => a.playedAt.localeCompare(b.playedAt)).slice(-limit);
}

export type { OutboxItem };
