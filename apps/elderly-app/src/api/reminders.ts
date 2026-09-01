import { buildSeedReminders, ensureSeedReminders, isDemoReminderId } from "../db/reminderSeed";
import { db, type ReminderCacheRow } from "../db/dexie";
import { enqueueReminderAck } from "../db/syncOutbox";
import {
  captureAuthScopedSnapshot,
  isAuthScopedSnapshotCurrent,
  type AuthScopedSnapshot,
} from "../lib/authLoadScope";
import { mapReminderToCacheRow } from "../lib/reminderMapping";
import { readUserId } from "../lib/authStorage";
import { assertActiveSession, SessionChangedError } from "../lib/sessionGuard";
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

function toCacheRow(row: ApiReminder, locale: string, userId: string): ReminderCacheRow {
  return mapReminderToCacheRow({
    id: row.id,
    userId,
    type: row.type,
    title: row.title,
    scheduledTime: row.scheduled_time,
    lastAcknowledgedAt: row.last_acknowledged_at,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    locale,
  });
}

async function assertReminderMutationAllowed(
  snapshot: AuthScopedSnapshot,
  userId: string,
  reminderId: string,
): Promise<void> {
  if (!isAuthScopedSnapshotCurrent(snapshot)) {
    throw new SessionChangedError();
  }
  const row = await db.reminders.get(reminderId);
  if (!row || row.userId !== userId) {
    throw new SessionChangedError();
  }
}

async function applyDemoAcknowledgement(
  snapshot: AuthScopedSnapshot,
  userId: string,
  reminderId: string,
): Promise<void> {
  await db.transaction("rw", db.reminders, async () => {
    await assertReminderMutationAllowed(snapshot, userId, reminderId);
    await db.reminders.update(reminderId, { done: 1, updatedAt: new Date().toISOString() });
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      throw new SessionChangedError();
    }
  });
}

async function applyOfflineAcknowledgement(
  snapshot: AuthScopedSnapshot,
  userId: string,
  reminderId: string,
): Promise<void> {
  await db.transaction("rw", db.reminders, db.outbox, async () => {
    await assertReminderMutationAllowed(snapshot, userId, reminderId);
    await db.reminders.update(reminderId, { done: 1, updatedAt: new Date().toISOString() });
    await enqueueReminderAck(reminderId, userId);
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      throw new SessionChangedError();
    }
  });
}

async function applyOnlineSuccessAcknowledgement(
  snapshot: AuthScopedSnapshot,
  userId: string,
  reminderId: string,
): Promise<void> {
  await db.transaction("rw", db.reminders, async () => {
    await assertReminderMutationAllowed(snapshot, userId, reminderId);
    await db.reminders.update(reminderId, { done: 1, updatedAt: new Date().toISOString() });
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      throw new SessionChangedError();
    }
  });
}

export async function loadRemindersFromCache(locale = "en"): Promise<ReminderCacheRow[]> {
  const userId = readUserId();
  if (!userId) {
    return [];
  }
  const rows = await db.reminders.where("userId").equals(userId).sortBy("scheduledTime");
  if (rows.length) {
    return rows;
  }
  return ensureSeedReminders(locale, userId);
}

export async function syncReminders(locale: string): Promise<ReminderCacheRow[]> {
  const snapshot = captureAuthScopedSnapshot();
  const { userId, token } = snapshot;
  if (!token || !userId || !navigator.onLine) {
    return loadRemindersFromCache(locale);
  }
  if (!isAuthScopedSnapshotCurrent(snapshot)) {
    return loadRemindersFromCache(locale);
  }
  try {
    assertActiveSession(userId, token);
    const response = await fetch(`${API_BASE}/users/${userId}/reminders`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return loadRemindersFromCache(locale);
    }
    if (!response.ok) {
      return loadRemindersFromCache(locale);
    }
    const rows = (await response.json()) as ApiReminder[];
    const cached = rows.filter((row) => row.is_active).map((row) => toCacheRow(row, locale, userId));
    let result: ReminderCacheRow[] = [];
    await db.transaction("rw", db.reminders, async () => {
      assertActiveSession(userId, token);
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        throw new SessionChangedError();
      }
      await db.reminders.where("userId").equals(userId).delete();
      if (cached.length) {
        await db.reminders.bulkPut(cached);
        result = cached;
      } else {
        const seeds = buildSeedReminders(locale, userId);
        await db.reminders.bulkPut(seeds);
        result = seeds;
      }
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        throw new SessionChangedError();
      }
    });
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return loadRemindersFromCache(locale);
    }
    return result;
  } catch (error) {
    if (error instanceof SessionChangedError) {
      return loadRemindersFromCache(locale);
    }
    return loadRemindersFromCache(locale);
  }
}

export async function acknowledgeReminder(reminderId: string, locale = "en"): Promise<ReminderCacheRow[]> {
  const snapshot = captureAuthScopedSnapshot();
  const userId = snapshot.userId;
  if (!userId) {
    return [];
  }
  const existing = await db.reminders.get(reminderId);
  if (!existing || existing.userId !== userId) {
    return loadRemindersFromCache(locale);
  }
  const isDemo = isDemoReminderId(reminderId);
  try {
    if (isDemo) {
      await applyDemoAcknowledgement(snapshot, userId, reminderId);
      return loadRemindersFromCache(locale);
    }
    const token = snapshot.token;
    if (!token || !navigator.onLine) {
      await applyOfflineAcknowledgement(snapshot, userId, reminderId);
      return loadRemindersFromCache(locale);
    }
    assertActiveSession(userId, token);
    const response = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return loadRemindersFromCache(locale);
    }
    if (response.ok) {
      await applyOnlineSuccessAcknowledgement(snapshot, userId, reminderId);
    } else {
      await applyOfflineAcknowledgement(snapshot, userId, reminderId);
    }
  } catch (error) {
    if (error instanceof SessionChangedError) {
      return loadRemindersFromCache(locale);
    }
    if (!isDemo && isAuthScopedSnapshotCurrent(snapshot)) {
      try {
        await applyOfflineAcknowledgement(snapshot, userId, reminderId);
      } catch (inner) {
        if (inner instanceof SessionChangedError) {
          return loadRemindersFromCache(locale);
        }
        throw inner;
      }
    }
  }
  return loadRemindersFromCache(locale);
}

export async function nextReminderFromApi(locale: string): Promise<ReminderCacheRow | undefined> {
  const rows = await syncReminders(locale);
  return rows.find((row) => row.done === 0);
}
