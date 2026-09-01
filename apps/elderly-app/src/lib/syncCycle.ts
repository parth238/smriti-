import { readLanguage } from "../i18n";
import { pullServerChanges } from "../db/syncPull";
import { flushOutbox } from "../db/syncOutbox";
import { AUTH_SESSION_CHANGED_EVENT, readAccessToken, readUserId } from "./authStorage";
import { sessionsMatch } from "./sessionGuard";
import {
  clearActiveSyncCycle,
  getActiveSyncCycle,
  setActiveSyncCycle,
} from "./syncCycleState";

export async function runSyncCycle(): Promise<{ flushed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { flushed: 0 };
  }
  const token = readAccessToken();
  const userId = readUserId();
  if (!token || !userId) {
    return { flushed: 0 };
  }

  const existing = getActiveSyncCycle(userId);
  if (existing) {
    return existing;
  }

  const capturedToken = token;
  const capturedUserId = userId;
  const locale = readLanguage();

  const cycle = (async () => {
    if (!sessionsMatch(capturedUserId, capturedToken)) {
      return { flushed: 0 };
    }
    let flushed = 0;
    try {
      flushed = await flushOutbox(capturedToken, capturedUserId);
    } catch {
      // Push failure must not block incremental pull.
    }
    if (!sessionsMatch(capturedUserId, capturedToken)) {
      return { flushed };
    }
    try {
      await pullServerChanges(capturedToken, capturedUserId, locale);
    } catch {
      // Pull failures must not affect outbox attempt counts.
    }
    return { flushed };
  })().finally(() => {
    clearActiveSyncCycle(capturedUserId, cycle);
  });

  setActiveSyncCycle(capturedUserId, cycle);
  return cycle;
}

export { resetSyncCycleForTests, invalidateActiveSyncCycles } from "./syncCycleState";
export { AUTH_SESSION_CHANGED_EVENT };
