import type { LiveRefreshStatus } from "../hooks/useCaregiverLiveRefresh";

type RefreshStatusProps = {
  status: LiveRefreshStatus;
  lastUpdatedLabel: string;
  isUpdating: boolean;
  onRefresh: () => void | Promise<void>;
  className?: string;
};

export function RefreshStatus({
  status,
  lastUpdatedLabel,
  isUpdating,
  onRefresh,
  className = "",
}: RefreshStatusProps) {
  const isLive = status === "live";
  const isOffline = status === "offline";
  const isError = status === "error" || status === "expired";

  const dotColor = isLive
    ? "bg-tea-garden"
    : isOffline
      ? "bg-mist-blue"
      : isError
        ? "bg-gamosa-red"
        : "bg-tea-garden";

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-sand bg-white/80 px-3.5 py-1.5 text-xs text-mist-blue shadow-xs backdrop-blur-xs ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${dotColor} ${
            isUpdating ? "animate-pulse" : ""
          }`}
          aria-hidden="true"
        />
        <span className="font-medium text-deep-hill">
          {isUpdating ? "Updating…" : lastUpdatedLabel}
        </span>
      </div>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => void onRefresh()}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-sand/50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-deep-hill transition-all hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50"
        title="Refresh data now"
        aria-label="Refresh caregiver data"
      >
        <span
          className={`inline-block ${isUpdating ? "animate-spin" : ""}`}
          aria-hidden="true"
        >
          ⟳
        </span>
        <span>Refresh</span>
      </button>
    </div>
  );
}
