import { API_BASE, getCaregiverToken } from "../auth/session";
import type { ReminderRow } from "../data/demo";
import { getReminderStatus } from "../lib/reminderStatus";
import {
  failureFromResponse,
  expiredSessionFailure,
  noPatientFailure,
  offlineFailure,
  type ApiFailure,
  type CaregiverDataFailure,
} from "./errors";
import { loadLinkedPatients } from "./patients";

export type DataSource = "live" | "error";

export type RemindersBundle =
  | {
      source: "live";
      label: string;
      rows: ReminderRow[];
      patientId: string;
    }
  | {
      source: "error";
      label: string;
      rows: [];
      error: CaregiverDataFailure;
    };

export type ApiReminder = {
  id: string;
  type: string;
  title: { en?: string; as?: string };
  scheduled_time: string;
  last_acknowledged_at: string | null;
  is_active: boolean;
};

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Schedule unavailable";
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toReminderRow(row: ApiReminder, now: Date): ReminderRow {
  return {
    id: row.id,
    title: row.title.en || row.title.as || "Reminder",
    time: formatTime(row.scheduled_time),
    status: getReminderStatus(
      {
        scheduledTime: row.scheduled_time,
        lastAcknowledgedAt: row.last_acknowledged_at,
        isActive: row.is_active,
      },
      now,
    ),
    acknowledgedTime: row.last_acknowledged_at
      ? formatTime(row.last_acknowledged_at)
      : undefined,
    type: row.type,
    scheduledTime: row.scheduled_time,
    active: row.is_active,
  };
}

export async function loadReminders(): Promise<RemindersBundle> {
  const patientResult = await loadLinkedPatients();
  if (!patientResult.ok) {
    return {
      source: "error",
      label: patientResult.error.message,
      rows: [],
      error: patientResult.error,
    };
  }
  const patient = patientResult.selected;
  if (!patient) {
    const error = noPatientFailure();
    return { source: "error", label: error.message, rows: [], error };
  }
  try {
    const response = await fetch(`${API_BASE}/users/${patient.user_id}/reminders`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      const error = await failureFromResponse(response, "Could not load reminders.");
      return {
        source: "error",
        label: error.message,
        rows: [],
        error,
      };
    }
    const rows = (await response.json()) as ApiReminder[];
    const now = new Date();
    return {
      source: "live",
      label: `Live · ${rows.length} reminders`,
      rows: rows.map((row) => toReminderRow(row, now)),
      patientId: patient.user_id,
    };
  } catch {
    const error = offlineFailure("The caregiver API could not be reached.");
    return {
      source: "error",
      label: error.message,
      rows: [],
      error,
    };
  }
}

export type ReminderMutationResult =
  | { ok: true; row: ReminderRow }
  | { ok: false; error: ApiFailure };

export type ReminderActionResult =
  | { ok: true }
  | { ok: false; error: ApiFailure };

export async function createReminder(input: {
  userId: string;
  titleEn: string;
  titleAs?: string;
  type: string;
  scheduledTime: string;
}): Promise<ReminderMutationResult> {
  const token = getCaregiverToken();
  if (!token) {
    return {
      ok: false,
      error: expiredSessionFailure(),
    };
  }
  if (!navigator.onLine) {
    return { ok: false, error: offlineFailure("A reminder cannot be created while offline.") };
  }
  try {
    const response = await fetch(`${API_BASE}/reminders`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: input.userId,
        type: input.type,
        title: { en: input.titleEn, as: input.titleAs || input.titleEn },
        scheduled_time: input.scheduledTime,
        recurrence_rule: "once",
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: await failureFromResponse(response, "The reminder could not be created."),
      };
    }
    return {
      ok: true,
      row: toReminderRow((await response.json()) as ApiReminder, new Date()),
    };
  } catch {
    return { ok: false, error: offlineFailure("The caregiver API could not be reached.") };
  }
}

export async function updateReminder(input: {
  reminderId: string;
  titleEn?: string;
  scheduledTime?: string;
  type?: string;
}): Promise<ReminderActionResult> {
  const token = getCaregiverToken();
  if (!token) {
    return {
      ok: false,
      error: expiredSessionFailure(),
    };
  }
  if (!navigator.onLine) {
    return { ok: false, error: offlineFailure("A reminder cannot be updated while offline.") };
  }
  const body: Record<string, unknown> = {};
  if (input.titleEn) {
    body.title = { en: input.titleEn };
  }
  if (input.scheduledTime) {
    body.scheduled_time = input.scheduledTime;
  }
  if (input.type) {
    body.type = input.type;
  }
  try {
    const response = await fetch(`${API_BASE}/reminders/${input.reminderId}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: await failureFromResponse(response, "The reminder could not be updated."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: offlineFailure("The caregiver API could not be reached.") };
  }
}

export async function deactivateReminder(reminderId: string): Promise<ReminderActionResult> {
  const token = getCaregiverToken();
  if (!token) {
    return {
      ok: false,
      error: expiredSessionFailure(),
    };
  }
  if (!navigator.onLine) {
    return { ok: false, error: offlineFailure("A reminder cannot be deactivated while offline.") };
  }
  try {
    const response = await fetch(`${API_BASE}/reminders/${reminderId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: await failureFromResponse(response, "The reminder could not be deactivated."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: offlineFailure("The caregiver API could not be reached.") };
  }
}
