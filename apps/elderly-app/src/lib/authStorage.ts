/** Auth/session keys — localStorage survives offline re-login; sessionStorage is tab-scoped. */

const ACCESS_KEY = "smriti.access";
const USER_KEY = "smriti.userId";
const PAIRED_KEY = "smriti.paired";
const DEVICE_KEY = "smriti.deviceId";

export function readAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_KEY) ?? window.localStorage.getItem(ACCESS_KEY);
}

export function readUserId(): string | null {
  return (
    window.sessionStorage.getItem(USER_KEY) ?? window.localStorage.getItem(USER_KEY)
  );
}

export function readPairedFlag(): boolean {
  const session = window.sessionStorage.getItem(PAIRED_KEY);
  const local = window.localStorage.getItem(PAIRED_KEY);
  return session === "1" || local === "1";
}

export function persistAuthSession(accessToken: string, userId?: string): void {
  window.sessionStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(PAIRED_KEY, "1");
  window.sessionStorage.setItem(PAIRED_KEY, "1");
  if (userId) {
    window.sessionStorage.setItem(USER_KEY, userId);
    window.localStorage.setItem(USER_KEY, userId);
  }
}

export function clearAuthSession(): void {
  for (const key of [ACCESS_KEY, USER_KEY, PAIRED_KEY]) {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  }
}

export function deviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, created);
  return created;
}
