import { requestReminderNotifications } from "./reminderScheduler";

export type ReminderNotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export type ReminderAlertLabelKey =
  | "enableReminderAlerts"
  | "reminderAlertsEnabled"
  | "reminderAlertsBlocked"
  | "reminderAlertsUnavailable";

/** Read browser notification permission without requesting it. */
export function readReminderNotificationPermissionState(): ReminderNotificationPermissionState {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return "default";
}

export function reminderAlertLabelKey(
  state: ReminderNotificationPermissionState,
): ReminderAlertLabelKey {
  switch (state) {
    case "granted":
      return "reminderAlertsEnabled";
    case "denied":
      return "reminderAlertsBlocked";
    case "unsupported":
      return "reminderAlertsUnavailable";
    default:
      return "enableReminderAlerts";
  }
}

export function canRequestReminderAlerts(state: ReminderNotificationPermissionState): boolean {
  return state === "default";
}

/** User-gesture handler: request permission, then refresh displayed state. */
export async function handleReminderAlertButtonClick(refreshState: () => void): Promise<void> {
  try {
    await requestReminderNotifications();
  } catch {
    // Browser may reject the permission prompt; treat as denied.
  } finally {
    refreshState();
  }
}
