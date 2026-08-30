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

export type OutboxItem = {
  id?: number;
  kind: "game_session";
  payload: LocalGameSession;
  createdAt: string;
  attempts: number;
};

export type ReminderCacheRow = {
  id: string;
  titleKey: string;
  timeKey: string;
  done: number;
  updatedAt: string;
};

export type PairedUserRow = {
  id: string;
  phone: string;
  pairedAt: string;
};

class SmritiDb extends Dexie {
  sessions!: EntityTable<LocalGameSession, "id">;
  outbox!: EntityTable<OutboxItem, "id">;
  reminders!: EntityTable<ReminderCacheRow, "id">;
  paired!: EntityTable<PairedUserRow, "id">;

  constructor() {
    super("smriti_elderly");
    this.version(1).stores({
      sessions: "++id, clientGeneratedId, userId, gameType, playedAt, synced",
      outbox: "++id, kind, createdAt",
      reminders: "id, updatedAt",
      paired: "id, phone",
    });
  }
}

export const db = new SmritiDb();
