export const REMINDER_GRACE_PERIOD_MS = 5 * 60 * 1000;

export type ReminderStatus =
  | "acknowledged"
  | "upcoming"
  | "due"
  | "missed"
  | "inactive"
  | "unknown";

export type ReminderStatusInput = {
  scheduledTime?: string | null;
  lastAcknowledgedAt?: string | null;
  isActive: boolean;
};

function parseTimestamp(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getReminderStatus(
  reminder: ReminderStatusInput,
  now: Date = new Date(),
): ReminderStatus {
  if (reminder.lastAcknowledgedAt) {
    return "acknowledged";
  }
  if (!reminder.isActive) {
    return "inactive";
  }

  const scheduledAt = parseTimestamp(reminder.scheduledTime);
  const currentTime = now.getTime();
  if (scheduledAt === null || Number.isNaN(currentTime)) {
    return "unknown";
  }
  if (currentTime < scheduledAt) {
    return "upcoming";
  }
  if (currentTime <= scheduledAt + REMINDER_GRACE_PERIOD_MS) {
    return "due";
  }
  return "missed";
}

export function getReminderStatusLabel(input: {
  status: ReminderStatus;
  time: string;
  acknowledgedTime?: string | null;
}): string {
  switch (input.status) {
    case "acknowledged":
      return input.acknowledgedTime
        ? `Marked done at ${input.acknowledgedTime}`
        : "Marked done";
    case "upcoming":
      return `Scheduled for ${input.time}`;
    case "due":
      return "Due now · awaiting acknowledgement";
    case "missed":
      return `Missed · was not marked done (${input.time})`;
    case "inactive":
      return "Inactive";
    case "unknown":
      return "Schedule unavailable";
  }
}
