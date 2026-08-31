import { useEffect, useState } from "react";

import { flushOutbox, failedOutboxCount, pendingOutboxCount } from "../db/syncOutbox";
import { readAccessToken } from "../lib/authStorage";

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

    async function runFlush() {
      const count = await flushOutbox(readAccessToken());
      await refreshCounts();
      if (count > 0) {
        setLastFlush(Date.now());
        attempt = 0;
      }
      return count;
    }

    function scheduleRetry() {
      const delay = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
      retryTimer = window.setTimeout(async () => {
        attempt += 1;
        const count = await runFlush();
        if (count === 0 && navigator.onLine && (await pendingOutboxCount()) > 0) {
          scheduleRetry();
        }
      }, delay);
    }

    function onOnline() {
      setOnline(true);
      void runFlush().then(async (count) => {
        if (count === 0 && (await pendingOutboxCount()) > 0) {
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

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void runFlush().then(async (count) => {
      if (count === 0 && navigator.onLine && (await pendingOutboxCount()) > 0) {
        scheduleRetry();
      }
    });

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        void runFlush();
      }
    }, 60000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      window.clearInterval(interval);
    };
  }, []);

  return { online, lastFlush, pending, failed };
}
