import { useCallback, useEffect, useState } from "react";

import { loadFamilyMemories, type ApiMemoryItem } from "../api/memories";
import { useI18n } from "../context/LanguageContext";

export function usePersonalMemories() {
  const { language } = useI18n();
  const [rows, setRows] = useState<ApiMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  const refresh = useCallback(async () => {
    setOffline(!navigator.onLine);
    setLoading(true);
    const items = await loadFamilyMemories();
    setRows(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const pickTitle = (item: ApiMemoryItem): string => {
    return item.title[language] ?? item.title.en ?? item.title.as ?? "Memory";
  };

  const pickPrompt = (item: ApiMemoryItem): string | undefined => {
    if (!item.prompt_text) {
      return undefined;
    }
    return item.prompt_text[language] ?? item.prompt_text.en ?? item.prompt_text.as;
  };

  return { rows, loading, offline, refresh, pickTitle, pickPrompt };
}
