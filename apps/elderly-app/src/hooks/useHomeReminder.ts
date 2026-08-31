import { useEffect, useState } from "react";

import { nextReminderFromApi } from "../api/reminders";
import type { ReminderCacheRow } from "../db/dexie";
import { useI18n } from "../context/LanguageContext";
import { nextOpenReminder } from "../store/demoStore";

export function useHomeReminder(): ReminderCacheRow | { title: string; timeLabel: string } | undefined {
  const { language, tx } = useI18n();
  const [live, setLive] = useState<ReminderCacheRow | undefined>();

  useEffect(() => {
    void nextReminderFromApi(language).then(setLive);
  }, [language]);

  if (live) {
    return live;
  }
  const fallback = nextOpenReminder();
  if (!fallback) {
    return undefined;
  }
  return { title: tx(fallback.titleKey), timeLabel: tx(fallback.timeKey) };
}
