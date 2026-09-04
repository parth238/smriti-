import { useCallback, useEffect, useRef, useState } from "react";

import { isCaregiverSignedIn } from "../auth/session";
import { PATIENT_CHANGE_EVENT } from "../api/patients";

export type LiveRefreshStatus =
  | "initial"
  | "updating"
  | "live"
  | "offline"
  | "error"
  | "expired";

export type LiveRefreshOptions<T> = {
  fetcher: () => Promise<T>;
  intervalMs?: number;
  staleMs?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
};

export type LiveRefreshResult<T> = {
  data: T | null;
  status: LiveRefreshStatus;
  lastUpdated: Date | null;
  lastUpdatedLabel: string;
  isUpdating: boolean;
  refresh: () => Promise<void>;
};

function formatLastUpdated(date: Date | null): string {
  if (!date) {
    return "Not updated yet";
  }

  const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secondsAgo < 15) {
    return "Live · updated just now";
  }

  return `Live · updated ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function useCaregiverLiveRefresh<T>({
  fetcher,
  intervalMs = 60_000,
  staleMs = 30_000,
  enabled = true,
}: LiveRefreshOptions<T>): LiveRefreshResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LiveRefreshStatus>("initial");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const lastUpdatedRef = useRef<Date | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const performFetch = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (!isCaregiverSignedIn()) {
      setStatus("expired");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }

    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsUpdating(true);
    setStatus((prev) => (prev === "initial" ? "initial" : "updating"));

    const currentRequestId = ++requestIdRef.current;

    try {
      const result = await fetcherRef.current();

      // Prevent out-of-order/stale responses
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Check if result has standard Smriti error format
      if (
        result &&
        typeof result === "object" &&
        "source" in result &&
        (result as { source: string }).source === "error"
      ) {
        const errorResult = result as {
          source: "error";
          error?: { kind?: string; status?: number };
        };

        if (
          errorResult.error?.kind === "authentication" ||
          errorResult.error?.status === 401
        ) {
          setStatus("expired");
        } else if (
          errorResult.error?.kind === "offline" ||
          (typeof navigator !== "undefined" && !navigator.onLine)
        ) {
          setStatus("offline");
        } else {
          setStatus("error");
        }
        setData(result);
        return;
      }

      const now = new Date();
      lastUpdatedRef.current = now;
      setLastUpdated(now);
      setData(result);
      setStatus("live");
    } catch {
      if (currentRequestId === requestIdRef.current) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setStatus("offline");
        } else {
          setStatus("error");
        }
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        inFlightRef.current = false;
        setIsUpdating(false);
      }
    }
  }, [enabled]);

  // Initial load
  useEffect(() => {
    void performFetch();
  }, [performFetch]);

  // Patient switch listener
  useEffect(() => {
    const handlePatientChange = () => {
      // Invalidate existing patient data immediately and refetch
      setData(null);
      void performFetch();
    };

    window.addEventListener(PATIENT_CHANGE_EVENT, handlePatientChange);
    return () => {
      window.removeEventListener(PATIENT_CHANGE_EVENT, handlePatientChange);
    };
  }, [performFetch]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      void performFetch();
    };

    const handleOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [performFetch]);

  // Window Focus / Tab visibility listener (fetches only if data is stale)
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      const last = lastUpdatedRef.current;
      const isStale = !last || Date.now() - last.getTime() > staleMs;
      if (isStale) {
        void performFetch();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [performFetch, staleMs]);

  // Polling interval
  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (status === "expired") {
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }
      void performFetch();
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, performFetch, status]);

  const lastUpdatedLabel =
    status === "updating" && !lastUpdated
      ? "Updating…"
      : status === "offline"
        ? "Offline"
        : status === "error"
          ? "Update failed"
          : status === "expired"
            ? "Session expired"
            : formatLastUpdated(lastUpdated);

  return {
    data,
    status,
    lastUpdated,
    lastUpdatedLabel,
    isUpdating,
    refresh: performFetch,
  };
}
