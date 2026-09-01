export type ReminderNotificationPayload = {
  title: string;
  body: string;
  tag: string;
  icon?: string;
};

/** Late ownership guard — must return true immediately before display. */
export type ReminderDeliveryGuard = () => boolean;

const DEFAULT_ICON = "/icons/icon.svg";

/** Display one reminder notification while the PWA page is running. */
export async function showReminderNotification(
  payload: ReminderNotificationPayload,
  guard: ReminderDeliveryGuard,
): Promise<boolean> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }

  const options: NotificationOptions = {
    body: payload.body,
    tag: payload.tag,
    icon: payload.icon ?? DEFAULT_ICON,
  };

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!guard()) {
        return false;
      }
      if (registration?.active) {
        if (!guard()) {
          return false;
        }
        await registration.showNotification(payload.title, options);
        return true;
      }
    } catch {
      return false;
    }
  }

  if (!guard()) {
    return false;
  }

  try {
    new Notification(payload.title, options);
    return true;
  } catch {
    return false;
  }
}
