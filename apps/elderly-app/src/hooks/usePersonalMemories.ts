import { useCallback, useEffect, useState } from "react";

import { type ApiMemoryItem } from "../api/memories";
import { readCachedFamilyMemories } from "../db/memoryCache";
import { useI18n } from "../context/LanguageContext";
import { readUserId } from "../lib/authStorage";
import { onServerPullComplete } from "../lib/syncEvents";
import { shouldRefreshForPullEvent } from "./useReminders";

export function usePersonalMemories() {
  const { language } = useI18n();
  const [rows, setRows] = useState<ApiMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  const loadCache = useCallback(async () => {
    setOffline(!navigator.onLine);
    setLoading(true);
    const userId = readUserId();
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const items = await readCachedFamilyMemories(userId);
    setRows(items);
    setLoading(false);
  }, []);

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

  const pickTitle = (item: ApiMemoryItem): string => {
    return item.title[language] ?? item.title.en ?? item.title.as ?? "Memory";
  };

  const pickPrompt = (item: ApiMemoryItem): string | undefined => {
    if (!item.prompt_text) {
      return undefined;
    }
    return item.prompt_text[language] ?? item.prompt_text.en ?? item.prompt_text.as;
  };

  return { rows, loading, offline, refresh: loadCache, pickTitle, pickPrompt };
}
