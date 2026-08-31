import { ensureSeedReminders, isDemoReminderId } from "../db/reminderSeed";
import { db, type ReminderCacheRow } from "../db/dexie";
import { enqueueReminderAck } from "../db/syncOutbox";
import { readAccessToken, readUserId } from "../lib/authStorage";
import { API_BASE } from "./auth";

export type ApiReminder = {
  id: string;
  type: string;
  title: Record<string, string>;
  scheduled_time: string;
  last_acknowledged_at: string | null;
  is_active: boolean;
};

function formatTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleTimeString(locale === "as" ? "as-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toCacheRow(row: ApiReminder, locale: string): ReminderCacheRow {
  const title = row.title[locale] ?? row.title.en ?? row.type;
  const done = row.last_acknowledged_at ? 1 : 0;
  return {
    id: row.id,
    type: row.type,
    title,
    scheduledTime: row.scheduled_time,
    timeLabel: formatTime(row.scheduled_time, locale),
    done,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadRemindersFromCache(locale = "en"): Promise<ReminderCacheRow[]> {
  const rows = await db.reminders.orderBy("scheduledTime").toArray();
  if (rows.length) {
    return rows;
  }
  return ensureSeedReminders(locale);
}

export async function syncReminders(locale: string): Promise<ReminderCacheRow[]> {
  const token = readAccessToken();
  const userId = readUserId();
  if (!token || !userId || !navigator.onLine) {
    return loadRemindersFromCache(locale);
  }
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/reminders`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) {
      return loadRemindersFromCache(locale);
    }
    const rows = (await response.json()) as ApiReminder[];
    const cached = rows.map((row) => toCacheRow(row, locale));
    await db.reminders.clear();
    if (cached.length) {
      await db.reminders.bulkPut(cached);
      return cached;
    }
    return ensureSeedReminders(locale);
  } catch {
    return loadRemindersFromCache(locale);
  }
}

export async function acknowledgeReminder(reminderId: string, locale = "en"): Promise<ReminderCacheRow[]> {
  const token = readAccessToken();
  const userId = readUserId();
  await db.reminders.update(reminderId, { done: 1, updatedAt: new Date().toISOString() });
  const isDemo = isDemoReminderId(reminderId);
  if (!isDemo && (!token || !userId || !navigator.onLine)) {
    await enqueueReminderAck(reminderId, userId ?? "unknown");
    return loadRemindersFromCache(locale);
  }
  if (!isDemo && token && userId && navigator.onLine) {
    try {
      const response = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        await enqueueReminderAck(reminderId, userId);
      }
    } catch {
      await enqueueReminderAck(reminderId, userId);
    }
  }
  return loadRemindersFromCache(locale);
}

export async function nextReminderFromApi(locale: string): Promise<ReminderCacheRow | undefined> {
  const rows = await syncReminders(locale);
  return rows.find((row) => row.done === 0);
}
