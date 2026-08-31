import as from "../i18n/as.json";
import en from "../i18n/en.json";
import { db, type ReminderCacheRow } from "./dexie";

const LEGACY_KEY = "smriti.reminders";

/** Demo rows shown only when Dexie cache is empty and API is unreachable. */
export function buildSeedReminders(locale: string): ReminderCacheRow[] {
  const dict = locale === "as" ? as : en;
  const now = new Date().toISOString();
  return [
    {
      id: "demo-med-evening",
      type: "medicine",
      title: dict.reminderMedicine,
      scheduledTime: now,
      timeLabel: dict.reminderTimeEvening,
      done: 0,
      updatedAt: now,
    },
    {
      id: "demo-water",
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

export async function ensureSeedReminders(locale: string): Promise<ReminderCacheRow[]> {
  purgeLegacyReminderStorage();
  const existing = await db.reminders.count();
  if (existing > 0) {
    return db.reminders.orderBy("scheduledTime").toArray();
  }
  const seeds = buildSeedReminders(locale);
  await db.reminders.bulkPut(seeds);
  return seeds;
}
