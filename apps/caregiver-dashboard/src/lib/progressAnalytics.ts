import type { SessionRow, TrendPoint } from "../data/demo";

export type GameStat = {
  game: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number | null;
  avgAccuracy: number | null;
  avgReactionMs: number | null;
};

export type ProgressMetrics = {
  totalSessions: number;
  completedSessions: number;
  completionRate: number | null;
  avgAccuracy: number | null;
  avgReactionMs: number | null;
  activeDaysCount: number;
  gameStats: GameStat[];
};

export function parseSessionTimestamp(session: SessionRow): number {
  if (session.playedAtIso) {
    const isoTime = new Date(session.playedAtIso).getTime();
    if (!Number.isNaN(isoTime)) {
      return isoTime;
    }
  }
  const date = new Date(session.playedAt);
  if (!Number.isNaN(date.getTime())) {
    return date.getTime();
  }
  return 0;
}

export function deduplicateSessions(sessions: SessionRow[]): SessionRow[] {
  const seen = new Set<string>();
  const result: SessionRow[] = [];

  for (const session of sessions) {
    if (!session.id || !seen.has(session.id)) {
      if (session.id) {
        seen.add(session.id);
      }
      result.push(session);
    }
  }

  return result;
}

export function sortSessionsNewestFirst(sessions: SessionRow[]): SessionRow[] {
  return [...sessions].sort((a, b) => {
    return parseSessionTimestamp(b) - parseSessionTimestamp(a);
  });
}

const WEEKDAY_ORDER: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

export function parseTrendTimestamp(point: TrendPoint): number {
  const dateStr = point.date || point.day;
  if (!dateStr) {
    return 0;
  }
  const prefix = dateStr.trim().toLowerCase().slice(0, 3);
  if (prefix in WEEKDAY_ORDER) {
    return WEEKDAY_ORDER[prefix];
  }
  const isoTime = new Date(dateStr).getTime();
  if (!Number.isNaN(isoTime)) {
    return isoTime;
  }
  return 0;
}

export function sortTrendsChronologically(trends: TrendPoint[]): TrendPoint[] {
  return [...trends].sort((a, b) => {
    const timeA = parseTrendTimestamp(a);
    const timeB = parseTrendTimestamp(b);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.day || "").localeCompare(b.day || "");
  });
}

export function calculateCompletionRate(
  completed: number,
  total: number,
): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((completed / total) * 100);
}

export function calculateAverageAccuracy(
  sessions: Array<{ accuracy?: number | null }>,
): number | null {
  const valid = sessions.filter(
    (s): s is { accuracy: number } =>
      typeof s.accuracy === "number" &&
      !Number.isNaN(s.accuracy) &&
      s.accuracy >= 0,
  );

  if (valid.length === 0) {
    return null;
  }

  const sum = valid.reduce((acc, s) => acc + s.accuracy, 0);
  return Math.round(sum / valid.length);
}

export function calculateAverageReaction(
  sessions: Array<{ reactionMs?: number | null }>,
): number | null {
  const valid = sessions.filter(
    (s): s is { reactionMs: number } =>
      typeof s.reactionMs === "number" &&
      !Number.isNaN(s.reactionMs) &&
      s.reactionMs > 0,
  );

  if (valid.length === 0) {
    return null;
  }

  const sum = valid.reduce((acc, s) => acc + s.reactionMs, 0);
  return Math.round(sum / valid.length);
}

export function calculateActiveDays(sessions: SessionRow[]): number {
  const dayKeys = new Set<string>();

  for (const session of sessions) {
    if (session.playedAtIso) {
      const d = new Date(session.playedAtIso);
      if (!Number.isNaN(d.getTime())) {
        dayKeys.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
        continue;
      }
    }
    dayKeys.add(session.playedAt);
  }

  return dayKeys.size;
}

export function groupSessionsByGame(sessions: SessionRow[]): GameStat[] {
  const map = new Map<string, SessionRow[]>();

  for (const session of sessions) {
    const gameName = session.game || "Game";
    const existing = map.get(gameName);
    if (existing) {
      existing.push(session);
    } else {
      map.set(gameName, [session]);
    }
  }

  const stats: GameStat[] = [];

  for (const [game, gameSessions] of map.entries()) {
    const totalSessions = gameSessions.length;
    const completedSessions = gameSessions.filter((s) => s.completed).length;
    const completionRate = calculateCompletionRate(
      completedSessions,
      totalSessions,
    );
    const avgAccuracy = calculateAverageAccuracy(gameSessions);
    const avgReactionMs = calculateAverageReaction(gameSessions);

    stats.push({
      game,
      totalSessions,
      completedSessions,
      completionRate,
      avgAccuracy,
      avgReactionMs,
    });
  }

  return stats.sort((a, b) => b.totalSessions - a.totalSessions);
}

export function computeProgressMetrics(
  sessions: SessionRow[],
): ProgressMetrics {
  const deduped = deduplicateSessions(sessions);
  const totalSessions = deduped.length;
  const completedSessions = deduped.filter((s) => s.completed).length;
  const completionRate = calculateCompletionRate(
    completedSessions,
    totalSessions,
  );
  const avgAccuracy = calculateAverageAccuracy(deduped);
  const avgReactionMs = calculateAverageReaction(deduped);
  const activeDaysCount = calculateActiveDays(deduped);
  const gameStats = groupSessionsByGame(deduped);

  return {
    totalSessions,
    completedSessions,
    completionRate,
    avgAccuracy,
    avgReactionMs,
    activeDaysCount,
    gameStats,
  };
}
