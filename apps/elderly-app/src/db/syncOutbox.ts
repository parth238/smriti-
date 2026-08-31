import { API_BASE } from "../api/auth";
import { GAME_IDS } from "../api/games";
import { deviceId } from "../lib/authStorage";
import { db, type LocalGameSession, type OutboxItem, type ReminderAckPayload } from "./dexie";

export async function enqueueSession(session: LocalGameSession): Promise<void> {
  await db.outbox.add({
    kind: "game_session",
    payload: session,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

export async function enqueueReminderAck(reminderId: string, userId: string): Promise<void> {
  const payload: ReminderAckPayload = {
    reminderId,
    userId,
    acknowledgedAt: new Date().toISOString(),
  };
  await db.outbox.add({
    kind: "reminder_ack",
    payload,
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
    await db.sessions.update(existing.id, session);
    return;
  }
  await db.sessions.add(session);
}

async function postSession(session: LocalGameSession, token: string): Promise<boolean> {
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
  return response.ok || response.status === 409;
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

async function flushBatch(items: OutboxItem[], token: string): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>();
  if (!items.length) {
    return results;
  }
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

export async function pendingOutboxCount(): Promise<number> {
  return db.outbox.count();
}

export async function flushOutbox(token: string | null): Promise<number> {
  if (!token || !navigator.onLine) {
    return 0;
  }
  const items = await db.outbox.orderBy("createdAt").toArray();
  if (!items.length) {
    return 0;
  }

  const batchResults = await flushBatch(items, token);
  let flushed = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.id || item.attempts >= 8) {
      continue;
    }
    const batchOk = batchResults.get(index);
    try {
      let ok = batchOk === true;
      if (batchOk === undefined) {
        if (item.kind === "game_session") {
          ok = await postSession(item.payload, token);
        } else {
          const response = await fetch(`${API_BASE}/reminders/${item.payload.reminderId}/acknowledge`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          ok = response.ok;
        }
      }
      if (!ok) {
        await db.outbox.update(item.id, { attempts: item.attempts + 1 });
        continue;
      }
      if (item.kind === "game_session") {
        await saveLocalSession({ ...item.payload, synced: 1 });
      }
      await db.outbox.delete(item.id);
      flushed += 1;
    } catch {
      await db.outbox.update(item.id, { attempts: item.attempts + 1 });
    }
  }
  return flushed;
}

export async function recentSessionsForGame(
  gameType: string,
  limit = 12,
): Promise<LocalGameSession[]> {
  const rows = await db.sessions.where("gameType").equals(gameType).toArray();
  return rows.sort((a, b) => a.playedAt.localeCompare(b.playedAt)).slice(-limit);
}

export type { OutboxItem };
