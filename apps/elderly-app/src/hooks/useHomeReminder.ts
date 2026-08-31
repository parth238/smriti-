import { useEffect, useState } from "react";

import { nextReminderFromApi } from "../api/reminders";
import type { ReminderCacheRow } from "../db/dexie";
import { useI18n } from "../context/LanguageContext";

export function useHomeReminder(): ReminderCacheRow | undefined {
  const { language } = useI18n();
  const [live, setLive] = useState<ReminderCacheRow | undefined>();

  useEffect(() => {
    void nextReminderFromApi(language).then(setLive);
  }, [language]);

  return live;
}
