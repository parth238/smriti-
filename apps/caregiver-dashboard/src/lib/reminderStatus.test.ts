import { describe, expect, it } from "vitest";

import {
  REMINDER_GRACE_PERIOD_MS,
  getReminderStatus,
  getReminderStatusLabel,
} from "./reminderStatus";

const SCHEDULED_TIME = "2026-09-04T10:00:00.000Z";

function activeReminder(overrides: {
  scheduledTime?: string | null;
  lastAcknowledgedAt?: string | null;
  isActive?: boolean;
} = {}) {
  return {
    scheduledTime: SCHEDULED_TIME,
    lastAcknowledgedAt: null,
    isActive: true,
    ...overrides,
  };
}

describe("getReminderStatus", () => {
  it("gives acknowledgement precedence over schedule and activity", () => {
    expect(
      getReminderStatus(
        activeReminder({
          scheduledTime: "not-a-date",
          lastAcknowledgedAt: "2026-09-04T09:58:00.000Z",
          isActive: false,
        }),
        new Date("2026-09-04T11:00:00.000Z"),
      ),
    ).toBe("acknowledged");
  });

  it("classifies an acknowledged future reminder as acknowledged", () => {
    expect(
      getReminderStatus(
        activeReminder({ lastAcknowledgedAt: "2026-09-04T09:45:00.000Z" }),
        new Date("2026-09-04T09:50:00.000Z"),
      ),
    ).toBe("acknowledged");
  });

  it("classifies an acknowledged past reminder as acknowledged", () => {
    expect(
      getReminderStatus(
        activeReminder({ lastAcknowledgedAt: "2026-09-04T10:01:00.000Z" }),
        new Date("2026-09-04T11:00:00.000Z"),
      ),
    ).toBe("acknowledged");
  });

  it("classifies a future reminder as upcoming", () => {
    expect(
      getReminderStatus(activeReminder(), new Date("2026-09-04T09:59:59.999Z")),
    ).toBe("upcoming");
  });

  it("classifies the scheduled instant as due", () => {
    expect(getReminderStatus(activeReminder(), new Date(SCHEDULED_TIME))).toBe("due");
  });

  it("classifies a reminder inside the grace window as due", () => {
    expect(
      getReminderStatus(activeReminder(), new Date("2026-09-04T10:04:00.000Z")),
    ).toBe("due");
  });

  it("keeps exactly scheduled time plus five minutes due", () => {
    const boundary = new Date(new Date(SCHEDULED_TIME).getTime() + REMINDER_GRACE_PERIOD_MS);
    expect(getReminderStatus(activeReminder(), boundary)).toBe("due");
  });

  it("classifies only times later than the five-minute boundary as missed", () => {
    const afterBoundary = new Date(
      new Date(SCHEDULED_TIME).getTime() + REMINDER_GRACE_PERIOD_MS + 1,
    );
    expect(getReminderStatus(activeReminder(), afterBoundary)).toBe("missed");
  });

  it("classifies an unacknowledged inactive reminder as inactive", () => {
    expect(
      getReminderStatus(
        activeReminder({ isActive: false }),
        new Date("2026-09-04T11:00:00.000Z"),
      ),
    ).toBe("inactive");
  });

  it.each([undefined, null, "", "not-a-date"])(
    "classifies a missing or invalid schedule (%s) as unknown",
    (scheduledTime) => {
      expect(
        getReminderStatus(
          activeReminder({ scheduledTime }),
          new Date("2026-09-04T10:00:00.000Z"),
        ),
      ).toBe("unknown");
    },
  );

  it("compares timezone-offset timestamps as real instants", () => {
    expect(
      getReminderStatus(
        activeReminder({ scheduledTime: "2026-09-04T10:00:00+05:30" }),
        new Date("2026-09-04T04:32:00.000Z"),
      ),
    ).toBe("due");
  });
});

describe("getReminderStatusLabel", () => {
  it.each([
    ["acknowledged", "Marked done at Fri, 10:03 AM", "Fri, 10:03 AM"],
    ["upcoming", "Scheduled for Fri, 10:00 AM", undefined],
    ["due", "Due now · awaiting acknowledgement", undefined],
    ["missed", "Missed · was not marked done (Fri, 10:00 AM)", undefined],
    ["inactive", "Inactive", undefined],
    ["unknown", "Schedule unavailable", undefined],
  ] as const)("renders safe %s wording", (status, expected, acknowledgedTime) => {
    expect(
      getReminderStatusLabel({
        status,
        time: "Fri, 10:00 AM",
        acknowledgedTime,
      }),
    ).toBe(expected);
  });
});
