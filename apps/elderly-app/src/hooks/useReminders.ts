import { useCallback, useEffect, useRef, useState } from "react";

import {
  acknowledgeReminder,
  loadRemindersFromCache,
  syncReminders,
} from "../api/reminders";
import { useI18n } from "../context/LanguageContext";
import type { ReminderCacheRow } from "../db/dexie";
import { readAccessToken, readUserId } from "../lib/authStorage";
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
    setLoading(true);
    const rows = await loadRemindersFromCache(language);
    setItems(rows);
    setLoading(false);
  }, [language]);

  useEffect(() => {
    void loadCache();
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
    void syncReminders(language).then((rows) => {
      setItems(rows);
    });
  }, [language]);

  const markDone = useCallback(
    async (id: string) => {
      const rows = await acknowledgeReminder(id, language);
      setItems(rows.length ? rows : await loadRemindersFromCache(language));
    },
    [language],
  );

  const refresh = useCallback(async () => {
    if (navigator.onLine && readAccessToken()) {
      const rows = await syncReminders(language);
      setItems(rows);
      return;
    }
    await loadCache();
  }, [language, loadCache]);

  return { items, loading, markDone, refresh };
}
