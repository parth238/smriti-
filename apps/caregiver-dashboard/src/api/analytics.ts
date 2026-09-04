import { API_BASE, getCaregiverToken } from "../auth/session";
import type { SessionRow, TrendPoint } from "../data/demo";
import {
  failureFromResponse,
  noPatientFailure,
  offlineFailure,
  type CaregiverDataFailure,
} from "./errors";
import { loadLinkedPatients } from "./patients";

export type PatientSummary = {
  label: string;
  language: string;
  baselineAccuracy: number | null;
  baselineReactionMs: number | null;
  userId: string;
};

export type AnalyticsBundle =
  | {
      source: "live";
      updatedLabel: string;
      patient: PatientSummary;
      sessions: SessionRow[];
      trends: TrendPoint[];
      periodAccuracy: number | null;
      periodReactionMs: number | null;
      sessionsCount: number;
      finishedCount: number;
      note: string | null;
    }
  | {
      source: "error";
      error: CaregiverDataFailure;
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

function languageLabel(code: string): string {
  return code === "as" ? "Assamese" : "English";
}

export async function loadCaregiverAnalytics(): Promise<AnalyticsBundle> {
  const patientResult = await loadLinkedPatients();
  if (!patientResult.ok) {
    return { source: "error", error: patientResult.error };
  }
  const patient = patientResult.selected;
  if (!patient) {
    return { source: "error", error: noPatientFailure() };
  }

  try {
    const responses = await Promise.all([
      fetch(`${API_BASE}/users/${patient.user_id}/game-sessions?limit=30`, {
        headers: authHeaders(),
      }),
      fetch(`${API_BASE}/users/${patient.user_id}/analytics?period=7d`, {
        headers: authHeaders(),
      }),
      fetch(`${API_BASE}/users/${patient.user_id}/analytics/baseline`, {
        headers: authHeaders(),
      }),
      fetch(`${API_BASE}/users/${patient.user_id}/analytics/trend?metric=accuracy&days=7`, {
        headers: authHeaders(),
      }),
    ]);
    const failedResponse =
      responses.find((response) => response.status === 401) ??
      responses.find((response) => !response.ok);
    if (failedResponse) {
      return {
        source: "error",
        error: await failureFromResponse(failedResponse, "Could not load caregiver analytics."),
      };
    }

    const [sessionsRes, analyticsRes, baselineRes, trendRes] = responses;
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

    const sessions: SessionRow[] = sessionsJson.map((row) => ({
      id: row.id,
      game: row.game_label || row.game_type || "Game",
      playedAt: formatPlayedAt(row.played_at),
      accuracy: row.accuracy,
      reactionMs: row.reaction_time_ms,
      completed: row.completed_or_quit === "completed",
    }));

    const baselineAccuracy = baselineJson.avg_accuracy ?? trendJson.baseline_accuracy;
    const baselineReactionMs =
      baselineJson.avg_reaction_time_ms ?? trendJson.baseline_reaction_time_ms;
    const trends: TrendPoint[] = trendJson.points.flatMap((point) => {
      const accuracy = point.accuracy ?? baselineAccuracy;
      const reactionMs = point.reaction_time_ms ?? baselineReactionMs;
      return accuracy === null || reactionMs === null
        ? []
        : [{ day: point.day, accuracy, reactionMs }];
    });

    return {
      source: "live",
      updatedLabel: `Live · updated ${new Date().toLocaleTimeString()}`,
      patient: {
        label: patient.full_name,
        language: languageLabel(patient.preferred_language),
        baselineAccuracy,
        baselineReactionMs,
        userId: patient.user_id,
      },
      sessions,
      trends,
      periodAccuracy: analyticsJson.avg_accuracy,
      periodReactionMs: analyticsJson.avg_reaction_time_ms,
      sessionsCount: analyticsJson.sessions_count,
      finishedCount: sessions.filter((row) => row.completed).length,
      note: analyticsJson.baseline_comparison?.note ?? null,
    };
  } catch {
    return {
      source: "error",
      error: offlineFailure("The caregiver API could not be reached."),
    };
  }
}
