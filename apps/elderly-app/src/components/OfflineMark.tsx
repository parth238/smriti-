import { useEffect, useState } from "react";

import { useI18n } from "../context/LanguageContext";

export function OfflineMark() {
  const { tx } = useI18n();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) {
    return null;
  }
  return <p className="text-body text-mist-blue">{tx("offline")}</p>;
}
