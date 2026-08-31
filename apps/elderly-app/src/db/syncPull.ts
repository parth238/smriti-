import { fetchSyncStatus, type SyncStatusMemory, type SyncStatusReminder } from "../api/syncStatus";
import { db, type MemoryCacheRow, type ReminderCacheRow } from "./dexie";
import { mapReminderToCacheRow, parseTimestampMs } from "../lib/reminderMapping";
import { dispatchServerPullComplete } from "../lib/syncEvents";
import {
  readStoredNextSince,
  requestSinceFromStored,
  writeStoredNextSince,
} from "../lib/syncWatermark";
import { readAccessToken, readUserId } from "../lib/authStorage";

export type PullServerChangesResult = {
  remindersMerged: number;
  memoriesMerged: number;
  nextSince: string;
};

export function shouldSkipReminderMerge(
  existing: ReminderCacheRow | undefined,
  incomingUpdatedAt: string,
): boolean {
  if (!existing) {
    return false;
  }
  return parseTimestampMs(existing.updatedAt) > parseTimestampMs(incomingUpdatedAt);
}

export function resolveReminderDoneState(input: {
  serverAck: string | null;
  existingDone: number | undefined;
  pendingLocalAck: boolean;
}): number | undefined {
  if (input.pendingLocalAck && input.existingDone === 1) {
    return 1;
  }
  if (input.serverAck) {
    return 1;
  }
  if (input.pendingLocalAck) {
    return input.existingDone ?? 0;
  }
  return undefined;
}

export function mapSyncMemoryToCacheRow(
  row: SyncStatusMemory,
  userId: string,
  existing?: MemoryCacheRow,
): MemoryCacheRow {
  return {
    id: row.id,
    userId,
    mediaUrl: row.media_url,
    mediaType: existing?.mediaType ?? "image/jpeg",
    category: row.category,
    title: row.title,
    description: existing?.description ?? null,
    peopleTagged: existing?.peopleTagged ?? null,
    year: existing?.year ?? null,
    location: existing?.location ?? null,
    promptText: existing?.promptText ?? null,
    cachedAt: row.created_at,
  };
}

export function shouldSkipMemoryMerge(
  existing: MemoryCacheRow | undefined,
  incomingCreatedAt: string,
): boolean {
  if (!existing) {
    return false;
  }
  return parseTimestampMs(existing.cachedAt) > parseTimestampMs(incomingCreatedAt);
}

async function pendingReminderAckIds(): Promise<Set<string>> {
  const rows = await db.outbox.where("kind").equals("reminder_ack").toArray();
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.kind === "reminder_ack") {
      ids.add(row.payload.reminderId);
    }
  }
  return ids;
}

function sessionsMatch(expectedUserId: string, expectedToken: string): boolean {
  return readUserId() === expectedUserId && readAccessToken() === expectedToken;
}

export async function mergeSyncStatusIntoDexie(
  userId: string,
  locale: string,
  reminders: SyncStatusReminder[],
  memories: SyncStatusMemory[],
): Promise<{ remindersMerged: number; memoriesMerged: number }> {
  const pendingAcks = await pendingReminderAckIds();
  let remindersMerged = 0;
  let memoriesMerged = 0;

  await db.transaction("rw", [db.reminders, db.memoryItems, db.outbox], async () => {
    for (const reminder of reminders) {
      if (!reminder.is_active) {
        await db.reminders.delete(reminder.id);
        continue;
      }
      const existing = await db.reminders.get(reminder.id);
      if (shouldSkipReminderMerge(existing, reminder.updated_at)) {
        continue;
      }
      const pendingLocalAck = pendingAcks.has(reminder.id);
      const doneOverride = resolveReminderDoneState({
        serverAck: reminder.last_acknowledged_at,
        existingDone: existing?.done,
        pendingLocalAck,
      });
      const row = mapReminderToCacheRow({
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        scheduledTime: reminder.scheduled_time,
        lastAcknowledgedAt: reminder.last_acknowledged_at,
        updatedAt: reminder.updated_at,
        locale,
        doneOverride,
      });
      await db.reminders.put(row);
      remindersMerged += 1;
    }

    for (const memory of memories) {
      const existing = await db.memoryItems.get(memory.id);
      if (shouldSkipMemoryMerge(existing, memory.created_at)) {
        continue;
      }
      const row = mapSyncMemoryToCacheRow(memory, userId, existing);
      await db.memoryItems.put(row);
      memoriesMerged += 1;
    }
  });

  return { remindersMerged, memoriesMerged };
}

export async function pullServerChanges(
  token: string,
  userId: string,
  locale: string,
): Promise<PullServerChangesResult | null> {
  const expectedUserId = userId;
  const expectedToken = token;
  const previousCursor = readStoredNextSince(expectedUserId);
  const since = requestSinceFromStored(previousCursor);

  const payload = await fetchSyncStatus(expectedToken, expectedUserId, since);
  if (!sessionsMatch(expectedUserId, expectedToken)) {
    return null;
  }

  const { remindersMerged, memoriesMerged } = await mergeSyncStatusIntoDexie(
    expectedUserId,
    locale,
    payload.reminders,
    payload.memories,
  );

  if (!sessionsMatch(expectedUserId, expectedToken)) {
    return null;
  }

  writeStoredNextSince(expectedUserId, payload.next_since, previousCursor);

  const result: PullServerChangesResult = {
    remindersMerged,
    memoriesMerged,
    nextSince: payload.next_since,
  };

  dispatchServerPullComplete({
    userId: expectedUserId,
    remindersMerged,
    memoriesMerged,
    nextSince: payload.next_since,
  });

  return result;
}
