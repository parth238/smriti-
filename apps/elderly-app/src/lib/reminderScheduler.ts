import { db } from "../db/dexie";

const notifiedKeys = new Set<string>();

export async function requestReminderNotifications(): Promise<boolean> {
  if (typeof Notification === "undefined") {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission === "denied") {
    return false;
  }
  const result = await Notification.requestPermission();
  return result === "granted";
}

function notificationKey(id: string, scheduledTime: string): string {
  return `${id}:${scheduledTime}`;
}

async function fireDueReminders(): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  const now = Date.now();
  const rows = await db.reminders.filter((row) => row.done === 0).toArray();
  for (const row of rows) {
    const due = new Date(row.scheduledTime).getTime();
    if (Number.isNaN(due)) {
      continue;
    }
    const key = notificationKey(row.id, row.scheduledTime);
    if (notifiedKeys.has(key)) {
      continue;
    }
    if (due <= now && due > now - 5 * 60 * 1000) {
      notifiedKeys.add(key);
      try {
        new Notification(row.title, {
          body: row.timeLabel,
          tag: row.id,
          icon: "/icons/icon.svg",
        });
      } catch {
        // ignore — some browsers block without gesture
      }
    }
  }
}

/** Poll Dexie reminders and show local notifications when due. */
export function startReminderScheduler(): () => void {
  void requestReminderNotifications();
  void fireDueReminders();
  const interval = window.setInterval(() => {
    void fireDueReminders();
  }, 30_000);
  return () => window.clearInterval(interval);
}

export function resetReminderNotificationsForTests(): void {
  notifiedKeys.clear();
}
