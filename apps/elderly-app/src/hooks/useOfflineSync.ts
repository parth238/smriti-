import { useEffect, useState } from "react";

import { flushOutbox } from "../db/syncOutbox";

const ACCESS_KEY = "smriti.access";

export function readAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_KEY) ?? window.localStorage.getItem(ACCESS_KEY);
}

export function useOfflineSync() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastFlush, setLastFlush] = useState(0);

  useEffect(() => {
    function onOnline() {
      setOnline(true);
      void flushOutbox(readAccessToken()).then((count) => {
        if (count > 0) {
          setLastFlush(Date.now());
        }
      });
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine) {
      void flushOutbox(readAccessToken());
    }
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { online, lastFlush };
}
