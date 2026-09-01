import { db } from "../db/dexie";
import { AUTH_SESSION_CHANGED_EVENT, readUserId } from "./authStorage";
import { showReminderNotification } from "./reminderNotificationDelivery";

const notifiedKeys = new Set<string>();
const pendingKeys = new Set<string>();
let activeIntervalId: number | null = null;
let authListenerAttached = false;

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
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

function notificationKey(userId: string, id: string, scheduledTime: string): string {
  return `${userId}:${id}:${scheduledTime}`;
}

function clearNotificationTracking(): void {
  notifiedKeys.clear();
  pendingKeys.clear();
}

function attachAuthListener(): void {
  if (authListenerAttached || typeof window === "undefined") {
    return;
  }
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, clearNotificationTracking);
  authListenerAttached = true;
}

async function deliverDueReminder(
  userId: string,
  key: string,
  title: string,
  timeLabel: string,
  tag: string,
): Promise<void> {
  try {
    const delivered = await showReminderNotification(
      { title, body: timeLabel, tag },
      () => readUserId() === userId,
    );
    if (delivered) {
      notifiedKeys.add(key);
    }
  } finally {
    pendingKeys.delete(key);
  }
}

async function fireDueReminders(): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  const userId = readUserId();
  if (!userId) {
    return;
  }
  const now = Date.now();
  const rows = await db.reminders
    .where("userId")
    .equals(userId)
    .filter((row) => row.done === 0)
    .toArray();
  const deliveries: Promise<void>[] = [];
  for (const row of rows) {
    const due = new Date(row.scheduledTime).getTime();
    if (Number.isNaN(due)) {
      continue;
    }
    const key = notificationKey(userId, row.id, row.scheduledTime);
    if (notifiedKeys.has(key) || pendingKeys.has(key)) {
      continue;
    }
    if (due <= now && due > now - 5 * 60 * 1000) {
      if (readUserId() !== userId) {
        continue;
      }
      pendingKeys.add(key);
      deliveries.push(deliverDueReminder(userId, key, row.title, row.timeLabel, row.id));
    }
  }
  await Promise.allSettled(deliveries);
}

/** Poll Dexie reminders and show local notifications when due. */
export function startReminderScheduler(): () => void {
  attachAuthListener();
  if (activeIntervalId != null) {
    return stopReminderScheduler;
  }
  void fireDueReminders();
  activeIntervalId = window.setInterval(() => {
    void fireDueReminders();
  }, 30_000);
  return stopReminderScheduler;
}

function stopReminderScheduler(): void {
  if (activeIntervalId != null) {
    window.clearInterval(activeIntervalId);
    activeIntervalId = null;
  }
}

export function resetReminderNotificationsForTests(): void {
  stopReminderScheduler();
  clearNotificationTracking();
  if (authListenerAttached && typeof window !== "undefined") {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, clearNotificationTracking);
    authListenerAttached = false;
  }
}

/** Test hook — runs one scheduler poll without starting the interval. */
export async function pollDueRemindersForTests(): Promise<void> {
  await fireDueReminders();
}

/** Test hook — inspect successful delivery keys. */
export function notifiedReminderKeysForTests(): ReadonlySet<string> {
  return notifiedKeys;
}

/** Test hook — inspect in-flight delivery keys. */
export function pendingReminderKeysForTests(): ReadonlySet<string> {
  return pendingKeys;
}
