import { API_BASE, getCaregiverToken, getSelectedPatientId, setSelectedPatientId } from "../auth/session";
import {
  PATIENT,
  SESSIONS,
  TRENDS,
  type SessionRow,
  type TrendPoint,
} from "../data/demo";

export type DataSource = "live" | "demo";

export type PatientSummary = {
  label: string;
  language: string;
  region: string;
  baselineAccuracy: number;
  baselineReactionMs: number;
  userId: string | null;
};

export type AnalyticsBundle = {
  source: DataSource;
  updatedLabel: string;
  patient: PatientSummary;
  sessions: SessionRow[];
  trends: TrendPoint[];
  periodAccuracy: number | null;
  periodReactionMs: number | null;
  sessionsCount: number;
  finishedCount: number;
  note: string | null;
};

type LinkedPatient = {
  user_id: string;
  full_name: string;
  preferred_language: string;
  is_primary: boolean;
};

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

function formatPlayedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function demoBundle(label = "Demo sample · not live truth"): AnalyticsBundle {
  return {
    source: "demo",
    updatedLabel: label,
    patient: {
      label: PATIENT.label,
      language: PATIENT.language,
      region: PATIENT.region,
      baselineAccuracy: PATIENT.baselineAccuracy,
      baselineReactionMs: PATIENT.baselineReactionMs,
      userId: null,
    },
    sessions: SESSIONS,
    trends: TRENDS,
    periodAccuracy: PATIENT.baselineAccuracy,
    periodReactionMs: PATIENT.baselineReactionMs,
    sessionsCount: SESSIONS.length,
    finishedCount: SESSIONS.filter((row) => row.completed).length,
    note: "Reaction time is a bit higher than usual this week.",
  };
}

async function resolvePatientId(): Promise<string | null> {
  const existing = getSelectedPatientId();
  if (existing) {
    return existing;
  }
  const response = await fetch(`${API_BASE}/me/patients`, { headers: authHeaders() });
  if (!response.ok) {
    return null;
  }
  const rows = (await response.json()) as LinkedPatient[];
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  if (!primary) {
    return null;
  }
  setSelectedPatientId(primary.user_id);
  return primary.user_id;
}

export async function loadCaregiverAnalytics(): Promise<AnalyticsBundle> {
  const token = getCaregiverToken();
  if (!token || !navigator.onLine) {
    return demoBundle(
      token ? "Last cached / demo · API unreachable" : "Demo sample · sign in with API for live play",
    );
  }

  try {
    const userId = await resolvePatientId();
    if (!userId) {
      return demoBundle("Demo sample · no linked family member yet");
    }

    const [sessionsRes, analyticsRes, baselineRes, trendRes, patientsRes] = await Promise.all([
      fetch(`${API_BASE}/users/${userId}/game-sessions?limit=30`, { headers: authHeaders() }),
      fetch(`${API_BASE}/users/${userId}/analytics?period=7d`, { headers: authHeaders() }),
      fetch(`${API_BASE}/users/${userId}/analytics/baseline`, { headers: authHeaders() }),
      fetch(`${API_BASE}/users/${userId}/analytics/trend?metric=accuracy&days=7`, {
        headers: authHeaders(),
      }),
      fetch(`${API_BASE}/me/patients`, { headers: authHeaders() }),
    ]);

    if (!sessionsRes.ok || !analyticsRes.ok || !baselineRes.ok || !trendRes.ok) {
      return demoBundle("Last cached / demo · API returned an error");
    }

    const sessionsJson = (await sessionsRes.json()) as Array<{
      id: string;
      game_label?: string | null;
      game_type?: string | null;
      played_at: string;
      accuracy: number;
      reaction_time_ms: number;
      completed_or_quit: string;
    }>;
    const analyticsJson = (await analyticsRes.json()) as {
      avg_accuracy: number | null;
      avg_reaction_time_ms: number | null;
      sessions_count: number;
      baseline_comparison?: { note?: string | null };
    };
    const baselineJson = (await baselineRes.json()) as {
      avg_accuracy: number | null;
      avg_reaction_time_ms: number | null;
    };
    const trendJson = (await trendRes.json()) as {
      points: Array<{ day: string; accuracy: number | null; reaction_time_ms: number | null }>;
      baseline_accuracy: number | null;
      baseline_reaction_time_ms: number | null;
    };

    let label = PATIENT.label;
    let language = PATIENT.language;
    if (patientsRes.ok) {
      const patients = (await patientsRes.json()) as LinkedPatient[];
      const match = patients.find((row) => row.user_id === userId) ?? patients[0];
      if (match) {
        label = match.full_name;
        language = match.preferred_language === "as" ? "Assamese" : "English";
      }
    }

    const sessions: SessionRow[] = sessionsJson.map((row) => ({
      id: row.id,
      game: row.game_label || row.game_type || "Game",
      playedAt: formatPlayedAt(row.played_at),
      accuracy: row.accuracy,
      reactionMs: row.reaction_time_ms,
      completed: row.completed_or_quit === "completed",
    }));

    const trends: TrendPoint[] = trendJson.points.map((point) => ({
      day: point.day,
      accuracy: point.accuracy ?? baselineJson.avg_accuracy ?? PATIENT.baselineAccuracy,
      reactionMs: point.reaction_time_ms ?? baselineJson.avg_reaction_time_ms ?? PATIENT.baselineReactionMs,
    }));

    return {
      source: "live",
      updatedLabel: `Live · updated ${new Date().toLocaleTimeString()}`,
      patient: {
        label,
        language,
        region: "Assam",
        baselineAccuracy: baselineJson.avg_accuracy ?? PATIENT.baselineAccuracy,
        baselineReactionMs: baselineJson.avg_reaction_time_ms ?? PATIENT.baselineReactionMs,
        userId,
      },
      sessions,
      trends: trends.length ? trends : TRENDS,
      periodAccuracy: analyticsJson.avg_accuracy,
      periodReactionMs: analyticsJson.avg_reaction_time_ms,
      sessionsCount: analyticsJson.sessions_count,
      finishedCount: sessions.filter((row) => row.completed).length,
      note: analyticsJson.baseline_comparison?.note ?? null,
    };
  } catch {
    return demoBundle("Last cached / demo · API unreachable");
  }
}
