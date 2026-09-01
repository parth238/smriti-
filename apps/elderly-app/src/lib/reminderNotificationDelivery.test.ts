import { afterEach, describe, expect, it, vi } from "vitest";

import { showReminderNotification } from "./reminderNotificationDelivery";

const payload = {
  title: "Evening medicine",
  body: "8:00 in the evening",
  tag: "demo-med-evening",
};

describe("showReminderNotification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns false when permission is not granted", async () => {
    vi.stubGlobal("Notification", { permission: "default" });
    await expect(showReminderNotification(payload, () => true)).resolves.toBe(false);
  });

  it("uses service worker on Android-like environments where new Notification throws", async () => {
    const showNotification = vi.fn(async () => undefined);
    const NotificationCtor = vi.fn(() => {
      throw new Error("Constructors require a user gesture on this platform");
    });
    vi.stubGlobal("Notification", NotificationCtor);
    Object.defineProperty(NotificationCtor, "permission", { value: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: {},
          showNotification,
        })),
      },
    });

    await expect(showReminderNotification(payload, () => true)).resolves.toBe(true);

    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/icons/icon.svg",
    });
    expect(NotificationCtor).not.toHaveBeenCalled();
  });

  it("returns true only after showNotification resolves", async () => {
    let resolveShow!: () => void;
    const showNotification = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveShow = resolve;
        }),
    );
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: {},
          showNotification,
        })),
      },
    });

    const pending = showReminderNotification(payload, () => true);
    await Promise.resolve();
    expect(showNotification).toHaveBeenCalledTimes(1);

    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveShow();
    await expect(pending).resolves.toBe(true);
  });

  it("falls back to new Notification when no active service worker exists", async () => {
    const NotificationCtor = vi.fn(function NotificationMock() {
      return {};
    });
    Object.defineProperty(NotificationCtor, "permission", { value: "granted" });
    vi.stubGlobal("Notification", NotificationCtor);
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: null,
          showNotification: vi.fn(),
        })),
      },
    });

    await expect(showReminderNotification(payload, () => true)).resolves.toBe(true);
    expect(NotificationCtor).toHaveBeenCalledTimes(1);
  });

  it("returns false when both delivery paths fail", async () => {
    const NotificationCtor = vi.fn(() => {
      throw new Error("blocked");
    });
    Object.defineProperty(NotificationCtor, "permission", { value: "granted" });
    vi.stubGlobal("Notification", NotificationCtor);
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: {},
          showNotification: vi.fn(async () => {
            throw new Error("sw display failed");
          }),
        })),
      },
    });

    await expect(showReminderNotification(payload, () => true)).resolves.toBe(false);
    expect(NotificationCtor).not.toHaveBeenCalled();
  });

  it("returns false when guard fails after getRegistration resolves", async () => {
    const showNotification = vi.fn();
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: {},
          showNotification,
        })),
      },
    });

    await expect(showReminderNotification(payload, () => false)).resolves.toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });

  it("returns false when guard fails immediately before showNotification", async () => {
    const showNotification = vi.fn();
    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: {
        getRegistration: vi.fn(async () => ({
          active: {},
          showNotification,
        })),
      },
    });

    let calls = 0;
    await expect(
      showReminderNotification(payload, () => {
        calls += 1;
        return calls === 1;
      }),
    ).resolves.toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });
});
