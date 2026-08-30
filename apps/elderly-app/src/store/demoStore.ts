export type ReminderItem = {
  id: string;
  titleKey: "reminderMedicine" | "reminderWater";
  timeKey: "reminderTimeEvening" | "reminderTimeNow";
  done: boolean;
};

const reminderKey = "smriti.reminders";

const seed: ReminderItem[] = [
  {
    id: "med-evening",
    titleKey: "reminderMedicine",
    timeKey: "reminderTimeEvening",
    done: false,
  },
  {
    id: "water",
    titleKey: "reminderWater",
    timeKey: "reminderTimeNow",
    done: false,
  },
];

function readRaw(): ReminderItem[] {
  try {
    const raw = window.localStorage.getItem(reminderKey);
    if (!raw) {
      return seed;
    }
    const parsed = JSON.parse(raw) as ReminderItem[];
    return parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
}

export function loadReminders(): ReminderItem[] {
  return readRaw();
}

export function markReminderDone(id: string): ReminderItem[] {
  const next = readRaw().map((item) =>
    item.id === id ? { ...item, done: true } : item,
  );
  window.localStorage.setItem(reminderKey, JSON.stringify(next));
  return next;
}

export function nextOpenReminder(): ReminderItem | undefined {
  return readRaw().find((item) => !item.done);
}

export function greetingKey(hour: number): "greetMorning" | "greetAfternoon" | "greetEvening" {
  if (hour < 12) {
    return "greetMorning";
  }
  if (hour < 17) {
    return "greetAfternoon";
  }
  return "greetEvening";
}

const lastGameKey = "smriti.lastGame";

export function rememberGame(path: string): void {
  window.sessionStorage.setItem(lastGameKey, path);
}

export function lastGamePath(): string {
  return window.sessionStorage.getItem(lastGameKey) ?? "/games";
}
