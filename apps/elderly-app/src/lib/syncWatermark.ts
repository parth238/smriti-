/** Per-user incremental sync cursor stored in localStorage (not Dexie). */

export const SYNC_REPLAY_OVERLAP_MS = 5000;

export const SYNC_EPOCH_ISO = "1970-01-01T00:00:00.000Z";

function storageKey(userId: string): string {
  return `smriti.sync.nextSince:${userId}`;
}

export function isValidIsoTimestamp(value: string): boolean {
  const ms = Date.parse(value);
  return !Number.isNaN(ms);
}

export function readStoredNextSince(userId: string): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) {
    return null;
  }
  if (!isValidIsoTimestamp(raw)) {
    localStorage.removeItem(storageKey(userId));
    return null;
  }
  return raw;
}

export function clearStoredNextSince(userId: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(storageKey(userId));
}

export function requestSinceFromStored(storedNextSince: string | null): string {
  if (!storedNextSince || !isValidIsoTimestamp(storedNextSince)) {
    return SYNC_EPOCH_ISO;
  }
  const epochMs = Date.parse(SYNC_EPOCH_ISO);
  const storedMs = Date.parse(storedNextSince);
  const overlappedMs = Math.max(epochMs, storedMs - SYNC_REPLAY_OVERLAP_MS);
  return new Date(overlappedMs).toISOString();
}

export function shouldAdvanceCursor(stored: string | null, nextSince: string): boolean {
  if (!isValidIsoTimestamp(nextSince)) {
    return false;
  }
  if (!stored || !isValidIsoTimestamp(stored)) {
    return true;
  }
  return Date.parse(nextSince) >= Date.parse(stored);
}

export function writeStoredNextSince(userId: string, nextSince: string, previous: string | null): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  if (!shouldAdvanceCursor(previous, nextSince)) {
    return;
  }
  localStorage.setItem(storageKey(userId), nextSince);
}
