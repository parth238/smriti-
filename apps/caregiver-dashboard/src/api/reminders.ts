import { API_BASE, getCaregiverToken, getSelectedPatientId, setSelectedPatientId } from "../auth/session";
import { REMINDERS, type ReminderRow } from "../data/demo";

export type DataSource = "live" | "demo";

export type RemindersBundle = {
  source: DataSource;
  label: string;
  rows: ReminderRow[];
};

type ApiReminder = {
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
    return iso;
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
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
  const rows = (await response.json()) as Array<{ user_id: string; is_primary?: boolean }>;
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  if (!primary) {
    return null;
  }
  setSelectedPatientId(primary.user_id);
  return primary.user_id;
}

export async function loadReminders(): Promise<RemindersBundle> {
  const token = getCaregiverToken();
  if (!token || !navigator.onLine) {
    return {
      source: "demo",
      label: "Demo sample · sign in with API for live reminders",
      rows: REMINDERS,
    };
  }
  try {
    const userId = await resolvePatientId();
    if (!userId) {
      return {
        source: "demo",
        label: "Demo sample · no linked family member yet",
        rows: REMINDERS,
      };
    }
    const response = await fetch(`${API_BASE}/users/${userId}/reminders`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      return {
        source: "demo",
        label: "Demo sample · API returned an error",
        rows: REMINDERS,
      };
    }
    const rows = (await response.json()) as ApiReminder[];
    return {
      source: "live",
      label: `Live · ${rows.length} active reminders`,
      rows: rows.map((row) => ({
        id: row.id,
        title: row.title.en || row.title.as || "Reminder",
        time: formatTime(row.scheduled_time),
        missed: row.is_active && !row.last_acknowledged_at,
        type: row.type,
        scheduledTime: row.scheduled_time,
        active: row.is_active,
      })),
    };
  } catch {
    return {
      source: "demo",
      label: "Demo sample · API unreachable",
      rows: REMINDERS,
    };
  }
}

export async function createReminder(input: {
  titleEn: string;
  titleAs?: string;
  type: string;
  scheduledTime: string;
}): Promise<boolean> {
  const token = getCaregiverToken();
  const userId = await resolvePatientId();
  if (!token || !userId) {
    return false;
  }
  const response = await fetch(`${API_BASE}/reminders`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      type: input.type,
      title: { en: input.titleEn, as: input.titleAs || input.titleEn },
      scheduled_time: input.scheduledTime,
      recurrence_rule: "once",
    }),
  });
  return response.ok;
}

export async function updateReminder(input: {
  reminderId: string;
  titleEn?: string;
  scheduledTime?: string;
  type?: string;
}): Promise<boolean> {
  const token = getCaregiverToken();
  if (!token) {
    return false;
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
  const response = await fetch(`${API_BASE}/reminders/${input.reminderId}`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.ok;
}

export async function deactivateReminder(reminderId: string): Promise<boolean> {
  const token = getCaregiverToken();
  if (!token) {
    return false;
  }
  const response = await fetch(`${API_BASE}/reminders/${reminderId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return response.ok;
}
