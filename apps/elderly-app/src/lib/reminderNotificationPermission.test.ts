import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canRequestReminderAlerts,
  handleReminderAlertButtonClick,
  readReminderNotificationPermissionState,
  reminderAlertLabelKey,
} from "./reminderNotificationPermission";
import * as reminderScheduler from "./reminderScheduler";

describe("reminder notification permission state", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads default without requesting permission", () => {
    vi.stubGlobal("Notification", { permission: "default" });
    expect(readReminderNotificationPermissionState()).toBe("default");
  });

  it("reads granted without requesting permission", () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    expect(readReminderNotificationPermissionState()).toBe("granted");
  });

  it("reads denied without requesting permission", () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    expect(readReminderNotificationPermissionState()).toBe("denied");
  });

  it("reads unsupported when Notification API is missing", () => {
    vi.stubGlobal("Notification", undefined);
    expect(readReminderNotificationPermissionState()).toBe("unsupported");
  });

  it("maps permission states to honest label keys", () => {
    expect(reminderAlertLabelKey("default")).toBe("enableReminderAlerts");
    expect(reminderAlertLabelKey("granted")).toBe("reminderAlertsEnabled");
    expect(reminderAlertLabelKey("denied")).toBe("reminderAlertsBlocked");
    expect(reminderAlertLabelKey("unsupported")).toBe("reminderAlertsUnavailable");
  });

  it("allows request only in default state", () => {
    expect(canRequestReminderAlerts("default")).toBe(true);
    expect(canRequestReminderAlerts("granted")).toBe(false);
    expect(canRequestReminderAlerts("denied")).toBe(false);
    expect(canRequestReminderAlerts("unsupported")).toBe(false);
  });
});

describe("handleReminderAlertButtonClick", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls requestReminderNotifications exactly once and refreshes state", async () => {
    const requestSpy = vi
      .spyOn(reminderScheduler, "requestReminderNotifications")
      .mockResolvedValue(true);
    const refresh = vi.fn();

    await handleReminderAlertButtonClick(refresh);

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes state after denied result without throwing", async () => {
    vi.spyOn(reminderScheduler, "requestReminderNotifications").mockResolvedValue(false);
    const refresh = vi.fn();

    await expect(handleReminderAlertButtonClick(refresh)).resolves.toBeUndefined();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes state when requestPermission rejects without unhandled rejection", async () => {
    vi.spyOn(reminderScheduler, "requestReminderNotifications").mockRejectedValue(
      new Error("prompt dismissed"),
    );
    const refresh = vi.fn();

    await expect(handleReminderAlertButtonClick(refresh)).resolves.toBeUndefined();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("Settings notification control wiring", () => {
  const settingsSrc = readFileSync(
    resolve(import.meta.dirname, "../screens/Settings.tsx"),
    "utf8",
  );

  it("does not request permission on render or mount", () => {
    expect(settingsSrc).not.toContain("useEffect");
    expect(settingsSrc).not.toMatch(/useState\([^)]*requestReminderNotifications/);
    expect(settingsSrc).not.toContain("requestReminderNotifications(");
  });

  it("uses handleReminderAlertButtonClick from the button onClick handler", () => {
    expect(settingsSrc).toContain("handleReminderAlertButtonClick");
    expect(settingsSrc).toMatch(/onClick=\{\(\) => \{[\s\S]*handleReminderAlertButtonClick/);
  });

  it("reads permission state without requesting it", () => {
    expect(settingsSrc).toContain("readReminderNotificationPermissionState");
    expect(settingsSrc).toContain("reminderAlertLabelKey");
    expect(settingsSrc).toContain("canRequestReminderAlerts");
  });
});

describe("permission label refresh after request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("updates label key from default to granted after a successful request", async () => {
    let permission: NotificationPermission = "default";
    const requestPermission = vi.fn(async () => {
      permission = "granted";
      return permission;
    });
    vi.stubGlobal("Notification", {
      get permission() {
        return permission;
      },
      requestPermission,
    });

    expect(reminderAlertLabelKey(readReminderNotificationPermissionState())).toBe(
      "enableReminderAlerts",
    );

    await handleReminderAlertButtonClick(() => {
      /* refresh */
    });

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(reminderAlertLabelKey(readReminderNotificationPermissionState())).toBe(
      "reminderAlertsEnabled",
    );
  });
});
