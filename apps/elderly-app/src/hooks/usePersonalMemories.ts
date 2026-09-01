import { useCallback, useEffect, useState } from "react";

import { type ApiMemoryItem } from "../api/memories";
import { readCachedFamilyMemories } from "../db/memoryCache";
import { useI18n } from "../context/LanguageContext";
import { captureAuthScopedSnapshot, isAuthScopedSnapshotCurrent } from "../lib/authLoadScope";
import { AUTH_SESSION_CHANGED_EVENT, readUserId } from "../lib/authStorage";
import { onServerPullComplete } from "../lib/syncEvents";
import { shouldRefreshForPullEvent } from "./useReminders";

export function usePersonalMemories() {
  const { language } = useI18n();
  const [rows, setRows] = useState<ApiMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  const loadCache = useCallback(async () => {
    const snapshot = captureAuthScopedSnapshot();
    setOffline(!navigator.onLine);
    setLoading(true);
    const userId = snapshot.userId;
    if (!userId) {
      if (!isAuthScopedSnapshotCurrent(snapshot)) {
        return;
      }
      setRows([]);
      setLoading(false);
      return;
    }
    const items = await readCachedFamilyMemories(userId);
    if (!isAuthScopedSnapshotCurrent(snapshot)) {
      return;
    }
    setRows(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCache();
  }, [loadCache]);

  useEffect(() => {
    function onAuthSessionChanged() {
      setRows([]);
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
