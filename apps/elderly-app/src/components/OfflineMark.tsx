import { useI18n } from "../context/LanguageContext";
import { useOfflineSyncState } from "../context/OfflineSyncContext";

export function OfflineMark() {
  const { tx } = useI18n();
  const { online, pending, failed } = useOfflineSyncState();

  return (
    <>
      {!online ? <p className="text-body text-mist-blue">{tx("offline")}</p> : null}
      {failed > 0 ? (
        <p className="text-body text-gamosa-red" role="alert">
          {tx("syncFailed")}
        </p>
      ) : null}
      {pending > 0 && online ? (
        <p className="text-body text-mist-blue">{tx("offlineNote")}</p>
      ) : null}
    </>
  );
}
