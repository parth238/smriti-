import { createContext, useContext, type ReactNode } from "react";

import { useOfflineSync } from "../hooks/useOfflineSync";

type OfflineSyncState = ReturnType<typeof useOfflineSync>;

const OfflineSyncContext = createContext<OfflineSyncState | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const sync = useOfflineSync();
  return <OfflineSyncContext.Provider value={sync}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSyncState(): OfflineSyncState {
  const value = useContext(OfflineSyncContext);
  if (!value) {
    throw new Error("useOfflineSyncState must be used within OfflineSyncProvider");
  }
  return value;
}
