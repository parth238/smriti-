import type { ApiMemoryItem } from "../api/memories";
import { db, type MemoryCacheRow } from "./dexie";

function toRow(item: ApiMemoryItem): MemoryCacheRow {
  return {
    id: item.id,
    userId: item.user_id,
    mediaUrl: item.media_url,
    mediaType: item.media_type,
    category: item.category,
    title: item.title,
    description: item.description,
    peopleTagged: item.people_tagged,
    year: item.year,
    location: item.location,
    promptText: item.prompt_text,
    cachedAt: new Date().toISOString(),
  };
}

function fromRow(row: MemoryCacheRow): ApiMemoryItem {
  return {
    id: row.id,
    user_id: row.userId,
    media_url: row.mediaUrl,
    media_type: row.mediaType,
    category: row.category,
    title: row.title,
    description: row.description,
    people_tagged: row.peopleTagged,
    year: row.year,
    location: row.location,
    prompt_text: row.promptText,
    created_at: row.cachedAt,
  };
}

export async function cacheFamilyMemories(userId: string, items: ApiMemoryItem[]): Promise<void> {
  const rows = items.map(toRow);
  await db.transaction("rw", db.memoryItems, async () => {
    const stale = await db.memoryItems.where("userId").equals(userId).toArray();
    const staleIds = stale.map((row) => row.id);
    if (staleIds.length) {
      await db.memoryItems.bulkDelete(staleIds);
    }
    if (rows.length) {
      await db.memoryItems.bulkPut(rows);
    }
  });
}

export async function readCachedFamilyMemories(userId: string): Promise<ApiMemoryItem[]> {
  const rows = await db.memoryItems.where("userId").equals(userId).toArray();
  return rows.map(fromRow);
}
