import { useCallback, useEffect, useState } from "react";

import { acknowledgeReminder, loadRemindersFromCache, syncReminders } from "../api/reminders";
import { useI18n } from "../context/LanguageContext";
import type { ReminderCacheRow } from "../db/dexie";

export function useReminders() {
  const { language } = useI18n();
  const [items, setItems] = useState<ReminderCacheRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const rows = await syncReminders(language);
    setItems(rows);
    setLoading(false);
  }, [language]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markDone = useCallback(
    async (id: string) => {
      const rows = await acknowledgeReminder(id);
      setItems(rows.length ? rows : await loadRemindersFromCache());
    },
    [],
  );

  return { items, loading, markDone, refresh };
}
