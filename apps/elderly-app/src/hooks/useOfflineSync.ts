import { useEffect, useState } from "react";

import { failedOutboxCount, pendingOutboxCount } from "../db/syncOutbox";
import { readAccessToken } from "../lib/authStorage";
import { AUTH_SESSION_CHANGED_EVENT, runSyncCycle } from "../lib/syncCycle";

const RETRY_MS = [5000, 15000, 45000, 120000];

export { readAccessToken } from "../lib/authStorage";

export function useOfflineSync() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastFlush, setLastFlush] = useState(0);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let retryTimer: number | undefined;
    let attempt = 0;

    async function refreshCounts() {
      setPending(await pendingOutboxCount());
      setFailed(await failedOutboxCount());
    }

    async function runCycle() {
      const { flushed } = await runSyncCycle();
      await refreshCounts();
      if (flushed > 0) {
        setLastFlush(Date.now());
        attempt = 0;
      }
      return flushed;
    }

    function scheduleRetry() {
      const delay = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
      retryTimer = window.setTimeout(async () => {
        attempt += 1;
        const flushed = await runCycle();
        if (flushed === 0 && navigator.onLine && (await pendingOutboxCount()) > 0) {
          scheduleRetry();
        }
      }, delay);
    }

    function onOnline() {
      setOnline(true);
      void runCycle().then(async (flushed) => {
        if (flushed === 0 && (await pendingOutboxCount()) > 0) {
          scheduleRetry();
        }
      });
    }

    function onOffline() {
      setOnline(false);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    }

    function onAuthSessionChanged() {
      if (navigator.onLine && readAccessToken()) {
        void runCycle();
      }
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
    void runCycle().then(async (flushed) => {
      if (flushed === 0 && navigator.onLine && (await pendingOutboxCount()) > 0) {
        scheduleRetry();
      }
    });

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void runCycle();
      }
    }, 60000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthSessionChanged);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      window.clearInterval(interval);
    };
  }, []);

  return { online, lastFlush, pending, failed };
}
