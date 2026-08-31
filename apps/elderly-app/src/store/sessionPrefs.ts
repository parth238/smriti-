/** Session-scoped UI prefs (not offline data — see Dexie for reminders/sessions). */

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
