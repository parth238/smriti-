import type { ReminderCacheRow } from "../db/dexie";

export function formatReminderTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleTimeString(locale === "as" ? "as-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function mapReminderToCacheRow(input: {
  id: string;
  type: string;
  title: Record<string, string>;
  scheduledTime: string;
  lastAcknowledgedAt: string | null;
  updatedAt: string;
  locale: string;
  doneOverride?: number;
}): ReminderCacheRow {
  const title = input.title[input.locale] ?? input.title.en ?? input.type;
  const done =
    input.doneOverride !== undefined
      ? input.doneOverride
      : input.lastAcknowledgedAt
        ? 1
        : 0;
  return {
    id: input.id,
    type: input.type,
    title,
    scheduledTime: input.scheduledTime,
    timeLabel: formatReminderTime(input.scheduledTime, input.locale),
    done,
    updatedAt: input.updatedAt,
  };
}

export function parseTimestampMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}
