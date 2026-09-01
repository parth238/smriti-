import as from "../i18n/as.json";
import en from "../i18n/en.json";
import { db, type ReminderCacheRow } from "./dexie";

const LEGACY_KEY = "smriti.reminders";

export function demoUserKey(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function buildDemoReminderId(userId: string, kind: "med-evening" | "water"): string {
  return `demo-${demoUserKey(userId)}-${kind}`;
}

/** Demo rows shown only when Dexie cache is empty and API is unreachable. */
export function buildSeedReminders(locale: string, userId: string): ReminderCacheRow[] {
  const dict = locale === "as" ? as : en;
  const now = new Date().toISOString();
  return [
    {
      id: buildDemoReminderId(userId, "med-evening"),
      userId,
      type: "medicine",
      title: dict.reminderMedicine,
      scheduledTime: now,
      timeLabel: dict.reminderTimeEvening,
      done: 0,
      updatedAt: now,
    },
    {
      id: buildDemoReminderId(userId, "water"),
      userId,
      type: "hydration",
      title: dict.reminderWater,
      scheduledTime: now,
      timeLabel: dict.reminderTimeNow,
      done: 0,
      updatedAt: now,
    },
  ];
}

export function isDemoReminderId(id: string): boolean {
  return id.startsWith("demo-");
}

/** Drop legacy localStorage reminders — canonical store is Dexie `reminders` table. */
export function purgeLegacyReminderStorage(): void {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore quota / privacy mode
  }
}

export async function ensureSeedReminders(locale: string, userId: string): Promise<ReminderCacheRow[]> {
  purgeLegacyReminderStorage();
  const existing = await db.reminders.where("userId").equals(userId).count();
  if (existing > 0) {
    return db.reminders.where("userId").equals(userId).sortBy("scheduledTime");
  }
  const seeds = buildSeedReminders(locale, userId);
  await db.reminders.bulkPut(seeds);
  return seeds;
}
