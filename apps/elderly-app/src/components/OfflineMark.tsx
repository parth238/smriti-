import { useI18n } from "../context/LanguageContext";
import { useOfflineSync } from "../hooks/useOfflineSync";

export function OfflineMark() {
  const { tx } = useI18n();
  const { online } = useOfflineSync();

  if (online) {
    return null;
  }
  return <p className="text-body text-mist-blue">{tx("offline")}</p>;
}
