import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";

import { db } from "../db/dexie";
import * as authStorage from "./authStorage";
import * as delivery from "./reminderNotificationDelivery";
import {
  notifiedReminderKeysForTests,
  pollDueRemindersForTests,
  requestReminderNotifications,
  resetReminderNotificationsForTests,
  startReminderScheduler,
} from "./reminderScheduler";

const USER_ID = "user-a";
const REMINDER_ID = "reminder-1";
const SCHEDULED_TIME = "2026-09-01T12:00:00.000Z";

function dueReminderRow(scheduledTime = SCHEDULED_TIME) {
  return {
    id: REMINDER_ID,
    userId: USER_ID,
    type: "medicine",
    title: "Evening medicine",
    scheduledTime,
    timeLabel: "8:00 in the evening",
    done: 0,
    updatedAt: scheduledTime,
  };
}

describe("requestReminderNotifications", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns false when Notification API is unavailable", async () => {
    vi.stubGlobal("Notification", undefined);
    await expect(requestReminderNotifications()).resolves.toBe(false);
  });

  it("does not request again when already granted", async () => {
    const requestPermission = vi.fn();
    vi.stubGlobal("Notification", { permission: "granted", requestPermission });
    await expect(requestReminderNotifications()).resolves.toBe(true);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("does not request again when denied", async () => {
    const requestPermission = vi.fn();
    vi.stubGlobal("Notification", { permission: "denied", requestPermission });
    await expect(requestReminderNotifications()).resolves.toBe(false);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("requests permission once in default state", async () => {
    const requestPermission = vi.fn(async () => "granted" as NotificationPermission);
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    await expect(requestReminderNotifications()).resolves.toBe(true);
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("returns false when requestPermission rejects without throwing", async () => {
    const requestPermission = vi.fn(async () => {
      throw new Error("permission prompt dismissed");
    });
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    await expect(requestReminderNotifications()).resolves.toBe(false);
  });
});

describe("reminder scheduler delivery", () => {
  beforeEach(async () => {
    db.close();
    await Dexie.delete("smriti_elderly");
    await db.open();
    vi.stubGlobal("window", {
      sessionStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
      localStorage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
    });
    vi.spyOn(authStorage, "readUserId").mockReturnValue(USER_ID);
    vi.stubGlobal("Notification", { permission: "granted" });
  });

  afterEach(() => {
    resetReminderNotificationsForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function currentDueTime(): string {
    return new Date().toISOString();
  }

  it("does not add failed delivery to notifiedKeys and retries on a later poll", async () => {
    await db.reminders.put(dueReminderRow(currentDueTime()));
    const showSpy = vi
      .spyOn(delivery, "showReminderNotification")
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await pollDueRemindersForTests();
    expect(notifiedReminderKeysForTests().size).toBe(0);

    await pollDueRemindersForTests();
    expect(notifiedReminderKeysForTests().size).toBe(1);
    expect(showSpy).toHaveBeenCalledTimes(2);
  });

  it("deduplicates successful display", async () => {
    await db.reminders.put(dueReminderRow(currentDueTime()));
    const showSpy = vi.spyOn(delivery, "showReminderNotification").mockResolvedValue(true);

    await pollDueRemindersForTests();
    expect(notifiedReminderKeysForTests().size).toBe(1);
    await pollDueRemindersForTests();
    expect(showSpy).toHaveBeenCalledTimes(1);
  });

  it("prevents overlapping polls from displaying the same reminder twice", async () => {
    await db.reminders.put(dueReminderRow(currentDueTime()));
    let releaseFirst!: () => void;
    const showSpy = vi.spyOn(delivery, "showReminderNotification").mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          if (!releaseFirst) {
            releaseFirst = () => resolve(true);
            return;
          }
          resolve(true);
        }),
    );

    const first = pollDueRemindersForTests();
    const second = pollDueRemindersForTests();

    await vi.waitFor(() => {
      expect(showSpy).toHaveBeenCalledTimes(1);
    });

    releaseFirst();
    await first;
    await second;
    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(notifiedReminderKeysForTests().size).toBe(1);
  });

  it("does not display after account switch during service worker lookup", async () => {
    await db.reminders.put(dueReminderRow(currentDueTime()));
    let resolveRegistration!: (value: ServiceWorkerRegistration) => void;
    const registrationPending = new Promise<ServiceWorkerRegistration>((resolve) => {
      resolveRegistration = resolve;
    });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(() => registrationPending),
      },
    });

    const poll = pollDueRemindersForTests();
    await Promise.resolve();
    vi.spyOn(authStorage, "readUserId").mockReturnValue("user-b");
    resolveRegistration({
      active: {} as ServiceWorker,
      showNotification: vi.fn(),
    } as unknown as ServiceWorkerRegistration);
    await poll;

    expect(notifiedReminderKeysForTests().size).toBe(0);
  });
});

describe("startReminderScheduler", () => {
  beforeEach(() => {
    vi.spyOn(authStorage, "readUserId").mockReturnValue(null);
    vi.stubGlobal("window", {
      setInterval: vi.fn(() => 1),
      clearInterval: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetReminderNotificationsForTests();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not request notification permission on startup", () => {
    const requestPermission = vi.fn();
    vi.stubGlobal("Notification", { permission: "default", requestPermission });

    startReminderScheduler();

    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("returns a singleton interval guard", () => {
    vi.stubGlobal("Notification", { permission: "denied" });

    const stopFirst = startReminderScheduler();
    const stopSecond = startReminderScheduler();

    expect(stopFirst).toBe(stopSecond);
    stopFirst();
  });
});
