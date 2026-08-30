import { API_BASE } from "../api/auth";
import { GAME_IDS } from "../api/games";
import { db, type LocalGameSession, type OutboxItem } from "./dexie";

export async function enqueueSession(session: LocalGameSession): Promise<void> {
  await db.outbox.add({
    kind: "game_session",
    payload: session,
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

export async function flushOutbox(token: string | null): Promise<number> {
  if (!token || !navigator.onLine) {
    return 0;
  }
  const items = await db.outbox.orderBy("createdAt").toArray();
  let flushed = 0;
  for (const item of items) {
    if (item.kind !== "game_session") {
      continue;
    }
    try {
      const ok = await postSession(item.payload, token);
      if (!ok) {
        if (item.id != null) {
          await db.outbox.update(item.id, { attempts: item.attempts + 1 });
        }
        continue;
      }
      await saveLocalSession({ ...item.payload, synced: 1 });
      if (item.id != null) {
        await db.outbox.delete(item.id);
      }
      flushed += 1;
    } catch {
      if (item.id != null) {
        await db.outbox.update(item.id, { attempts: item.attempts + 1 });
      }
    }
  }
  return flushed;
}

export async function recentSessionsForGame(
  gameType: string,
  limit = 12,
): Promise<LocalGameSession[]> {
  const rows = await db.sessions.where("gameType").equals(gameType).toArray();
  return rows
    .sort((a, b) => a.playedAt.localeCompare(b.playedAt))
    .slice(-limit);
}

export type { OutboxItem };
