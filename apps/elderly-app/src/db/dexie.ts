import Dexie, { type EntityTable } from "dexie";

export type LocalGameSession = {
  id?: number;
  clientGeneratedId: string;
  userId: string;
  gameType: string;
  difficulty: number;
  accuracy: number;
  reactionTimeMs: number;
  errors: number;
  hintsUsed: number;
  sessionDurationSec: number;
  completedOrQuit: "completed" | "quit";
  playedAt: string;
  synced: number;
};

export type ReminderAckPayload = {
  reminderId: string;
  userId: string;
  acknowledgedAt: string;
};

type OutboxItemBase = {
  id?: number;
  userId: string;
  createdAt: string;
  attempts: number;
};

export type OutboxItem =
  | (OutboxItemBase & {
      kind: "game_session";
      payload: LocalGameSession;
    })
  | (OutboxItemBase & {
      kind: "reminder_ack";
      payload: ReminderAckPayload;
    });

export type ReminderCacheRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  scheduledTime: string;
  timeLabel: string;
  done: number;
  updatedAt: string;
};

export type PairedUserRow = {
  id: string;
  phone: string;
  pairedAt: string;
};

export type MemoryCacheRow = {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: string;
  category: string;
  title: Record<string, string>;
  description: string | null;
  peopleTagged: string[] | null;
  year: number | null;
  location: string | null;
  promptText: Record<string, string> | null;
  cachedAt: string;
};

type LegacyOutboxItem = {
  id?: number;
  kind: "game_session" | "reminder_ack";
  payload: LocalGameSession | ReminderAckPayload;
  createdAt: string;
  attempts: number;
  userId?: string;
};

type LegacyReminderCacheRow = Omit<ReminderCacheRow, "userId"> & {
  userId?: string;
};

function outboxUserIdFromPayload(item: LegacyOutboxItem): string | null {
  if (item.kind === "game_session") {
    const session = item.payload as LocalGameSession;
    return session.userId || null;
  }
  const ack = item.payload as ReminderAckPayload;
  return ack.userId || null;
}

function normalizeLegacyOutboxItem(item: LegacyOutboxItem): void {
  const payloadUserId = outboxUserIdFromPayload(item);
  if (!payloadUserId) {
    item.userId = "";
    return;
  }
  if (item.userId && item.userId !== payloadUserId) {
    item.userId = "";
    return;
  }
  item.userId = payloadUserId;
}

class SmritiDb extends Dexie {
  sessions!: EntityTable<LocalGameSession, "id">;
  outbox!: EntityTable<OutboxItem, "id">;
  reminders!: EntityTable<ReminderCacheRow, "id">;
  paired!: EntityTable<PairedUserRow, "id">;
  memoryItems!: EntityTable<MemoryCacheRow, "id">;

  constructor() {
    super("smriti_elderly");
    this.version(1).stores({
      sessions: "++id, clientGeneratedId, userId, gameType, playedAt, synced",
      outbox: "++id, kind, createdAt",
      reminders: "id, updatedAt",
      paired: "id, phone",
    });
    this.version(2).stores({
      sessions: "++id, clientGeneratedId, userId, gameType, playedAt, synced",
      outbox: "++id, kind, createdAt",
      reminders: "id, scheduledTime, updatedAt",
      paired: "id, phone",
    });
    this.version(3).stores({
      sessions: "++id, clientGeneratedId, userId, gameType, playedAt, synced",
      outbox: "++id, kind, createdAt",
      reminders: "id, scheduledTime, updatedAt",
      paired: "id, phone",
      memoryItems: "id, userId, cachedAt",
    });
    this.version(4)
      .stores({
        sessions: "++id, clientGeneratedId, userId, gameType, [userId+gameType], playedAt, synced",
        outbox: "++id, userId, kind, createdAt",
        reminders: "id, userId, scheduledTime, updatedAt, [userId+scheduledTime]",
        paired: "id, phone",
        memoryItems: "id, userId, cachedAt",
      })
      .upgrade(async (tx) => {
        const outbox = tx.table("outbox");
        await outbox.toCollection().modify((item: LegacyOutboxItem) => {
          normalizeLegacyOutboxItem(item);
        });
        const ownerlessOutbox = await outbox.filter((item: LegacyOutboxItem) => !item.userId).toArray();
        await outbox.bulkDelete(ownerlessOutbox.map((item) => item.id!).filter(Boolean));

        const reminders = tx.table("reminders");
        const legacyReminders = await reminders
          .filter((row: LegacyReminderCacheRow) => !row.userId)
          .toArray();
        await reminders.bulkDelete(legacyReminders.map((row) => row.id));
      });
  }
}

export const db = new SmritiDb();
