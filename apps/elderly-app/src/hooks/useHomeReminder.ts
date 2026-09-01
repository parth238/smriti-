import { useCallback, useEffect, useState } from "react";

import { loadRemindersFromCache } from "../api/reminders";
import type { ReminderCacheRow } from "../db/dexie";
import { useI18n } from "../context/LanguageContext";
import { captureAuthScopedSnapshot, isAuthScopedSnapshotCurrent } from "../lib/authLoadScope";
import { AUTH_SESSION_CHANGED_EVENT, readUserId } from "../lib/authStorage";
import { onServerPullComplete } from "../lib/syncEvents";
import { shouldRefreshForPullEvent } from "./useReminders";

export function useHomeReminder(): ReminderCacheRow | undefined {
  const { language } = useI18n();
  const [live, setLive] = useState<ReminderCacheRow | undefined>();

  const loadNext = useCallback(async () => {
    const snapshot = captureAuthScopedSnapshot();
    const rows = await loadRemindersFromCache(language);
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return;
    }
    setLive(rows.find((row) => row.done === 0));
  }, [language]);

  useEffect(() => {
    void loadNext();
  }, [loadNext]);

  useEffect(() => {
    function onAuthSessionChanged() {
      setLive(undefined);
      void loadNext();
    }
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
  }, [loadNext]);

  useEffect(() => {
    return onServerPullComplete((detail) => {
      if (!shouldRefreshForPullEvent(detail.userId, readUserId())) {
        return;
      }
      void loadNext();
    });
  }, [loadNext]);

  return live;
}
