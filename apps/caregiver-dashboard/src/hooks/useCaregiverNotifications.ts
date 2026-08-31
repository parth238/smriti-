import { useEffect, useRef } from "react";

import { loadReminders } from "../api/reminders";
import { isCaregiverSignedIn } from "../auth/session";

const notified = new Set<string>();

/** Browser notifications when linked elderly misses a reminder (live API only). */
export function useCaregiverNotifications(enabled = true): void {
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled || !isCaregiverSignedIn()) {
      return undefined;
    }

    async function poll() {
      if (ticking.current || typeof Notification === "undefined") {
        return;
      }
      ticking.current = true;
      try {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        if (Notification.permission !== "granted") {
          return;
        }
        const bundle = await loadReminders();
        if (bundle.source !== "live") {
          return;
        }
        for (const row of bundle.rows.filter((item) => item.missed)) {
          const key = `miss:${row.id}:${row.time}`;
          if (notified.has(key)) {
            continue;
          }
          notified.add(key);
          new Notification("Smriti — reminder note", {
            body: `${row.title} was not marked done (${row.time}). This is a calm note, not a medical alert.`,
            tag: key,
            icon: "/favicon.ico",
          });
        }
      } finally {
        ticking.current = false;
      }
    }

    void poll();
    const interval = window.setInterval(() => void poll(), 60_000);
    return () => window.clearInterval(interval);
  }, [enabled]);
}
