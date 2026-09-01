import { useCallback, useEffect, useRef, useState } from "react";

import {
  acknowledgeReminder,
  loadRemindersFromCache,
  syncReminders,
} from "../api/reminders";
import { useI18n } from "../context/LanguageContext";
import type { ReminderCacheRow } from "../db/dexie";
import { captureAuthScopedSnapshot, isAuthScopedSnapshotCurrent } from "../lib/authLoadScope";
import { AUTH_SESSION_CHANGED_EVENT, readAccessToken, readUserId } from "../lib/authStorage";
import { onServerPullComplete } from "../lib/syncEvents";

export function shouldRefreshForPullEvent(eventUserId: string, currentUserId: string | null): boolean {
  return !!currentUserId && eventUserId === currentUserId;
}

export function useReminders() {
  const { language } = useI18n();
  const [items, setItems] = useState<ReminderCacheRow[]>([]);
  const [loading, setLoading] = useState(true);
  const previousLanguage = useRef(language);

  const loadCache = useCallback(async () => {
    const snapshot = captureAuthScopedSnapshot();
    setLoading(true);
    const rows = await loadRemindersFromCache(language);
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return;
    }
    setItems(rows);
    setLoading(false);
  }, [language]);

  useEffect(() => {
    void loadCache();
  }, [loadCache]);

  useEffect(() => {
    function onAuthSessionChanged() {
      setItems([]);
      setLoading(true);
      void loadCache();
    }
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
  }, [loadCache]);

  useEffect(() => {
    return onServerPullComplete((detail) => {
      if (!shouldRefreshForPullEvent(detail.userId, readUserId())) {
        return;
      }
      void loadCache();
    });
  }, [loadCache]);

  useEffect(() => {
    if (previousLanguage.current === language) {
      return;
    }
    previousLanguage.current = language;
    if (!navigator.onLine || !readAccessToken()) {
      return;
    }
    const snapshot = captureAuthScopedSnapshot();
    void syncReminders(language).then((rows) => {
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        return;
      }
      setItems(rows);
    });
  }, [language]);

  const markDone = useCallback(
    async (id: string) => {
      const snapshot = captureAuthScopedSnapshot();
      const rows = await acknowledgeReminder(id, language);
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        return;
      }
      const nextRows = rows.length ? rows : await loadRemindersFromCache(language);
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        return;
      }
      setItems(nextRows);
    },
    [language],
  );

  const refresh = useCallback(async () => {
    const snapshot = captureAuthScopedSnapshot();
    if (navigator.onLine && readAccessToken()) {
      const rows = await syncReminders(language);
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        return;
      }
      setItems(rows);
      return;
    }
    await loadCache();
  }, [language, loadCache]);

  return { items, loading, markDone, refresh };
}
