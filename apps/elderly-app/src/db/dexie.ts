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

export type OutboxItem =
  | {
      id?: number;
      kind: "game_session";
      payload: LocalGameSession;
      createdAt: string;
      attempts: number;
    }
  | {
      id?: number;
      kind: "reminder_ack";
      payload: ReminderAckPayload;
      createdAt: string;
      attempts: number;
    };

export type ReminderCacheRow = {
  id: string;
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
  }
}

export const db = new SmritiDb();
