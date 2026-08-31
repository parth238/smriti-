import { useCallback, useEffect, useState } from "react";

import { loadRemindersFromCache } from "../api/reminders";
import type { ReminderCacheRow } from "../db/dexie";
import { useI18n } from "../context/LanguageContext";
import { readUserId } from "../lib/authStorage";
import { onServerPullComplete } from "../lib/syncEvents";
import { shouldRefreshForPullEvent } from "./useReminders";

export function useHomeReminder(): ReminderCacheRow | undefined {
  const { language } = useI18n();
  const [live, setLive] = useState<ReminderCacheRow | undefined>();

  const loadNext = useCallback(async () => {
    const rows = await loadRemindersFromCache(language);
    setLive(rows.find((row) => row.done === 0));
  }, [language]);

  useEffect(() => {
    void loadNext();
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
