import { readLanguage } from "../i18n";
import { pullServerChanges } from "../db/syncPull";
import { flushOutbox } from "../db/syncOutbox";
import { AUTH_SESSION_CHANGED_EVENT, readAccessToken, readUserId } from "./authStorage";

let activeCycle: Promise<{ flushed: number }> | null = null;
let activeCycleUserId: string | null = null;

export async function runSyncCycle(): Promise<{ flushed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { flushed: 0 };
  }
  const token = readAccessToken();
  const userId = readUserId();
  if (!token || !userId) {
    return { flushed: 0 };
  }

  if (activeCycle && activeCycleUserId === userId) {
    return activeCycle;
  }

  const locale = readLanguage();
  activeCycleUserId = userId;
  activeCycle = (async () => {
    let flushed = 0;
    try {
      flushed = await flushOutbox(token);
    } catch {
      // Push failure must not block incremental pull.
    }
    try {
      await pullServerChanges(token, userId, locale);
    } catch {
      // Pull failures must not affect outbox attempt counts.
    }
    return { flushed };
  })().finally(() => {
    activeCycle = null;
    activeCycleUserId = null;
  });

  return activeCycle;
}

export function resetSyncCycleForTests(): void {
  activeCycle = null;
  activeCycleUserId = null;
}

export { AUTH_SESSION_CHANGED_EVENT };
