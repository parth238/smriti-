import { isOutboxOwnershipConsistent } from "./syncOutbox";
import { fetchSyncStatus, type SyncStatusMemory, type SyncStatusReminder } from "../api/syncStatus";
import { db, type MemoryCacheRow, type ReminderCacheRow } from "./dexie";
import { mapReminderToCacheRow, parseTimestampMs } from "../lib/reminderMapping";
import { dispatchServerPullComplete } from "../lib/syncEvents";
import {
  readStoredNextSince,
  requestSinceFromStored,
  writeStoredNextSince,
} from "../lib/syncWatermark";
import { assertActiveSession, SessionChangedError, sessionsMatch } from "../lib/sessionGuard";

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

async function pendingReminderAckIds(userId: string): Promise<Set<string>> {
  const rows = await db.outbox.where("userId").equals(userId).toArray();
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.kind === "reminder_ack" && isOutboxOwnershipConsistent(row, userId)) {
      ids.add(row.payload.reminderId);
    }
  }
  return ids;
}

export async function mergeSyncStatusIntoDexie(
  userId: string,
  token: string,
  locale: string,
  reminders: SyncStatusReminder[],
  memories: SyncStatusMemory[],
): Promise<{ remindersMerged: number; memoriesMerged: number }> {
  assertActiveSession(userId, token);
  const pendingAcks = await pendingReminderAckIds(userId);
  let remindersMerged = 0;
  let memoriesMerged = 0;

  await db.transaction("rw", [db.reminders, db.memoryItems, db.outbox], async () => {
    assertActiveSession(userId, token);
    for (const reminder of reminders) {
      assertActiveSession(userId, token);
      if (!reminder.is_active) {
        const existing = await db.reminders.get(reminder.id);
        if (existing?.userId === userId) {
          await db.reminders.delete(reminder.id);
        }
        continue;
      }
      const existing = await db.reminders.get(reminder.id);
      if (existing && existing.userId !== userId) {
        continue;
      }
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
        userId,
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
      assertActiveSession(userId, token);
      const existing = await db.memoryItems.get(memory.id);
      if (existing && existing.userId !== userId) {
        continue;
      }
      if (shouldSkipMemoryMerge(existing, memory.created_at)) {
        continue;
      }
      const row = mapSyncMemoryToCacheRow(memory, userId, existing);
      await db.memoryItems.put(row);
      memoriesMerged += 1;
    }
    assertActiveSession(userId, token);
  });

  return { remindersMerged, memoriesMerged };
}

export async function pullServerChanges(
  token: string,
  userId: string,
  locale: string,
): Promise<PullServerChangesResult | null> {
  try {
    const expectedUserId = userId;
    const expectedToken = token;
    const previousCursor = readStoredNextSince(expectedUserId);
    const since = requestSinceFromStored(previousCursor);

    assertActiveSession(expectedUserId, expectedToken);
    const payload = await fetchSyncStatus(expectedToken, expectedUserId, since);
    if (!sessionsMatch(expectedUserId, expectedToken)) {
      return null;
    }

    let remindersMerged = 0;
    let memoriesMerged = 0;
    try {
      const merged = await mergeSyncStatusIntoDexie(
        expectedUserId,
        expectedToken,
        locale,
        payload.reminders,
        payload.memories,
      );
      remindersMerged = merged.remindersMerged;
      memoriesMerged = merged.memoriesMerged;
    } catch (error) {
      if (error instanceof SessionChangedError) {
        return null;
      }
      throw error;
    }

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
  } catch (error) {
    if (error instanceof SessionChangedError) {
      return null;
    }
    throw error;
  }
}

export { SessionChangedError };
