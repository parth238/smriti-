import { beforeEach, describe, expect, it, vi } from "vitest";

import * as syncStatus from "../api/syncStatus";
import { readStoredNextSince, writeStoredNextSince } from "../lib/syncWatermark";
import type { MemoryCacheRow, ReminderCacheRow } from "./dexie";
import {
  mapSyncMemoryToCacheRow,
  mergeSyncStatusIntoDexie,
  pullServerChanges,
  resolveReminderDoneState,
  shouldSkipMemoryMerge,
  shouldSkipReminderMerge,
} from "./syncPull";

const reminders = new Map<string, ReminderCacheRow>();
const memoryItems = new Map<string, MemoryCacheRow>();
let outboxRows: Array<{
  kind: string;
  userId: string;
  payload: { reminderId: string; userId: string; acknowledgedAt: string };
}> = [];
let transactionShouldFail = false;

vi.mock("./dexie", () => ({
  db: {
    reminders: {
      get: async (id: string) => reminders.get(id),
      put: async (row: ReminderCacheRow) => {
        if (transactionShouldFail) {
          throw new Error("rollback");
        }
        reminders.set(row.id, row);
      },
      delete: async (id: string) => {
        reminders.delete(id);
      },
    },
    memoryItems: {
      get: async (id: string) => memoryItems.get(id),
      put: async (row: MemoryCacheRow) => {
        if (transactionShouldFail) {
          throw new Error("rollback");
        }
        memoryItems.set(row.id, row);
      },
    },
    outbox: {
      where: () => ({
        equals: (userId: string) => ({
          toArray: async () => outboxRows.filter((row) => row.userId === userId),
        }),
      }),
    },
    transaction: async (_mode: string, _tables: unknown, fn: () => Promise<void>) => {
      await fn();
    },
  },
}));

describe("sync pull merge helpers", () => {
  beforeEach(() => {
    reminders.clear();
    memoryItems.clear();
    outboxRows = [];
    transactionShouldFail = false;
  });

  it("skips older reminder replay", () => {
    const existing: ReminderCacheRow = {
      id: "r1",
      userId: "user-1",
      type: "medicine",
      title: "New",
      scheduledTime: "2026-01-01T08:00:00.000Z",
      timeLabel: "8:00",
      done: 0,
      updatedAt: "2026-01-02T00:00:00.000Z",
    };
    expect(shouldSkipReminderMerge(existing, "2026-01-01T00:00:00.000Z")).toBe(true);
  });

  it("preserves pending local acknowledgement", () => {
    expect(
      resolveReminderDoneState({
        serverAck: null,
        existingDone: 1,
        pendingLocalAck: true,
      }),
    ).toBe(1);
  });

  it("merges newer authoritative server acknowledgement", () => {
    expect(
      resolveReminderDoneState({
        serverAck: "2026-01-02T00:00:00.000Z",
        existingDone: 0,
        pendingLocalAck: true,
      }),
    ).toBe(1);
  });

  it("maps sync memory rows for cache", () => {
    const row = mapSyncMemoryToCacheRow(
      {
        id: "m1",
        media_url: "/a.jpg",
        title: { en: "Photo" },
        category: "family",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      "user-1",
    );
    expect(row.userId).toBe("user-1");
    expect(row.cachedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("skips older memory replay", () => {
    const existing: MemoryCacheRow = {
      id: "m1",
      userId: "user-1",
      mediaUrl: "/a.jpg",
      mediaType: "image/jpeg",
      category: "family",
      title: { en: "Photo" },
      description: null,
      peopleTagged: null,
      year: null,
      location: null,
      promptText: null,
      cachedAt: "2026-01-02T00:00:00.000Z",
    };
    expect(shouldSkipMemoryMerge(existing, "2026-01-01T00:00:00.000Z")).toBe(true);
  });
});

describe("mergeSyncStatusIntoDexie", () => {
  beforeEach(async () => {
    reminders.clear();
    memoryItems.clear();
    outboxRows = [];
    transactionShouldFail = false;
    vi.spyOn(await import("../lib/authStorage"), "readUserId").mockReturnValue("user-1");
    vi.spyOn(await import("../lib/authStorage"), "readAccessToken").mockReturnValue("token");
    reminders.set("keep", {
      id: "keep",
      userId: "user-1",
      type: "other",
      title: "Keep me",
      scheduledTime: "2026-01-01T09:00:00.000Z",
      timeLabel: "9:00",
      done: 0,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    memoryItems.set("keep-m", {
      id: "keep-m",
      userId: "user-1",
      mediaUrl: "/keep.jpg",
      mediaType: "image/jpeg",
      category: "family",
      title: { en: "Keep" },
      description: null,
      peopleTagged: null,
      year: null,
      location: null,
      promptText: null,
      cachedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("upserts without clearing unrelated rows", async () => {
    await mergeSyncStatusIntoDexie(
      "user-1",
      "token",
      "en",
      [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Medicine" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-02T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      [
        {
          id: "m1",
          media_url: "/m1.jpg",
          title: { en: "New" },
          category: "family",
          created_at: "2026-01-02T00:00:00.000Z",
        },
      ],
    );
    expect(reminders.has("keep")).toBe(true);
    expect(memoryItems.has("keep-m")).toBe(true);
    expect(reminders.has("r1")).toBe(true);
    expect(memoryItems.has("m1")).toBe(true);
  });

  it("does not duplicate equal-id replay upserts", async () => {
    const payload = {
      id: "r1",
      type: "medicine",
      title: { en: "Medicine" },
      scheduled_time: "2026-01-01T08:00:00.000Z",
      recurrence_rule: null,
      is_active: true,
      updated_at: "2026-01-02T00:00:00.000Z",
      last_acknowledged_at: null,
    };
    await mergeSyncStatusIntoDexie("user-1", "token", "en", [payload], []);
    await mergeSyncStatusIntoDexie("user-1", "token", "en", [payload], []);
    expect(reminders.size).toBe(2);
    expect(reminders.get("r1")?.title).toBe("Medicine");
  });

  it("does not overwrite newer cached reminder with older replay", async () => {
    reminders.set("r1", {
      id: "r1",
      userId: "user-1",
      type: "medicine",
      title: "Newer",
      scheduledTime: "2026-01-01T08:00:00.000Z",
      timeLabel: "8:00",
      done: 0,
      updatedAt: "2026-01-03T00:00:00.000Z",
    });
    await mergeSyncStatusIntoDexie(
      "user-1",
      "token",
      "en",
      [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Older" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-01T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      [],
    );
    expect(reminders.get("r1")?.title).toBe("Newer");
  });

  it("preserves optimistic done state while ack is pending in outbox", async () => {
    reminders.set("r1", {
      id: "r1",
      userId: "user-1",
      type: "medicine",
      title: "Med",
      scheduledTime: "2026-01-01T08:00:00.000Z",
      timeLabel: "8:00",
      done: 1,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    outboxRows = [{ kind: "reminder_ack", userId: "user-1", payload: { reminderId: "r1", userId: "user-1", acknowledgedAt: "2026-01-01T00:00:00.000Z" } }];
    await mergeSyncStatusIntoDexie(
      "user-1",
      "token",
      "en",
      [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Med" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-03T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      [],
    );
    expect(reminders.get("r1")?.done).toBe(1);
  });

  it("rolls back both reminder and memory changes on failure", async () => {
    transactionShouldFail = true;
    await expect(
      mergeSyncStatusIntoDexie(
        "user-1",
        "token",
        "en",
        [
          {
            id: "r-new",
            type: "medicine",
            title: { en: "Medicine" },
            scheduled_time: "2026-01-01T08:00:00.000Z",
            recurrence_rule: null,
            is_active: true,
            updated_at: "2026-01-02T00:00:00.000Z",
            last_acknowledged_at: null,
          },
        ],
        [
          {
            id: "m-new",
            media_url: "/m.jpg",
            title: { en: "Photo" },
            category: "family",
            created_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      ),
    ).rejects.toThrow("rollback");
    expect(reminders.has("r-new")).toBe(false);
    expect(memoryItems.has("m-new")).toBe(false);
  });
});

describe("pullServerChanges", () => {
  beforeEach(() => {
    reminders.clear();
    memoryItems.clear();
    outboxRows = [];
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("does not advance cursor on HTTP failure", async () => {
    vi.spyOn(syncStatus, "fetchSyncStatus").mockRejectedValue(new Error("network"));
    vi.spyOn(await import("../lib/authStorage"), "readUserId").mockReturnValue("user-a");
    vi.spyOn(await import("../lib/authStorage"), "readAccessToken").mockReturnValue("token");
    await expect(pullServerChanges("token", "user-a", "en")).rejects.toThrow("network");
    expect(readStoredNextSince("user-a")).toBeNull();
  });

  it("does not advance cursor on malformed response", async () => {
    vi.spyOn(syncStatus, "fetchSyncStatus").mockRejectedValue(
      new Error("Sync status response missing next_since"),
    );
    vi.spyOn(await import("../lib/authStorage"), "readUserId").mockReturnValue("user-a");
    vi.spyOn(await import("../lib/authStorage"), "readAccessToken").mockReturnValue("token");
    await expect(pullServerChanges("token", "user-a", "en")).rejects.toThrow("next_since");
    expect(readStoredNextSince("user-a")).toBeNull();
  });

  it("does not advance cursor on Dexie transaction failure", async () => {
    transactionShouldFail = true;
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-03T00:00:00.000Z",
      reminders: [
        {
          id: "r-fail",
          type: "medicine",
          title: { en: "Medicine" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-02T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [],
    });
    vi.spyOn(await import("../lib/authStorage"), "readUserId").mockReturnValue("user-a");
    vi.spyOn(await import("../lib/authStorage"), "readAccessToken").mockReturnValue("token");
    await expect(pullServerChanges("token", "user-a", "en")).rejects.toThrow("rollback");
    expect(readStoredNextSince("user-a")).toBeNull();
  });

  it("advances cursor only after successful merge", async () => {
    transactionShouldFail = false;
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-04T00:00:00.000Z",
      reminders: [],
      memories: [],
    });
    const auth = await import("../lib/authStorage");
    vi.spyOn(auth, "readUserId").mockReturnValue("user-a");
    vi.spyOn(auth, "readAccessToken").mockReturnValue("token");
    const result = await pullServerChanges("token", "user-a", "en");
    expect(result?.nextSince).toBe("2026-01-04T00:00:00.000Z");
    expect(readStoredNextSince("user-a")).toBe("2026-01-04T00:00:00.000Z");
  });

  it("aborts merge and cursor update when user changes mid-request", async () => {
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-04T00:00:00.000Z",
      reminders: [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Medicine" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-02T00:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [],
    });
    const auth = await import("../lib/authStorage");
    vi.spyOn(auth, "readUserId").mockReturnValue("user-b");
    vi.spyOn(auth, "readAccessToken").mockReturnValue("token");

    const result = await pullServerChanges("token", "user-a", "en");
    expect(result).toBeNull();
    expect(readStoredNextSince("user-a")).toBeNull();
    expect(reminders.has("r1")).toBe(false);
  });

  it("does not move stored cursor backward on response", async () => {
    writeStoredNextSince("user-a", "2026-01-05T00:00:00.000Z", null);
    vi.spyOn(syncStatus, "fetchSyncStatus").mockResolvedValue({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-04T00:00:00.000Z",
      reminders: [],
      memories: [],
    });
    const auth = await import("../lib/authStorage");
    vi.spyOn(auth, "readUserId").mockReturnValue("user-a");
    vi.spyOn(auth, "readAccessToken").mockReturnValue("token");
    await pullServerChanges("token", "user-a", "en");
    expect(readStoredNextSince("user-a")).toBe("2026-01-05T00:00:00.000Z");
  });
});
