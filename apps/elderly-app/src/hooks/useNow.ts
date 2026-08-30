import { useEffect, useState } from "react";

export function clockAngles(now: Date) {
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  return {
    hour: hours * 30 + minutes * 0.5,
    minute: minutes * 6,
  };
}

export function useNow(language: string) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(tick);
  }, [language]);

  const locale = language === "as" ? "as-IN" : "en-IN";
  return {
    now,
    day: now.toLocaleDateString(locale, { weekday: "long" }),
    date: now.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: now.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }),
  };
}
