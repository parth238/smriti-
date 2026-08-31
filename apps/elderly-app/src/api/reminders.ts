import { ensureSeedReminders, isDemoReminderId } from "../db/reminderSeed";
import { db, type ReminderCacheRow } from "../db/dexie";
import { enqueueReminderAck } from "../db/syncOutbox";
import { mapReminderToCacheRow } from "../lib/reminderMapping";
import { readAccessToken, readUserId } from "../lib/authStorage";
import { API_BASE } from "./auth";

export type ApiReminder = {
  id: string;
  type: string;
  title: Record<string, string>;
  scheduled_time: string;
  last_acknowledged_at: string | null;
  is_active: boolean;
  updated_at?: string;
};

function toCacheRow(row: ApiReminder, locale: string): ReminderCacheRow {
  return mapReminderToCacheRow({
    id: row.id,
    type: row.type,
    title: row.title,
    scheduledTime: row.scheduled_time,
    lastAcknowledgedAt: row.last_acknowledged_at,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    locale,
  });
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
    const cached = rows.filter((row) => row.is_active).map((row) => toCacheRow(row, locale));
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
