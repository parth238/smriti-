/** Fired after a game session is saved locally — adaptive hooks listen to refresh difficulty. */
export const ADAPTIVE_REFRESH_EVENT = "smriti:sessionRecorded";

export function notifyAdaptiveRefresh(gameType: string): void {
  window.dispatchEvent(new CustomEvent(ADAPTIVE_REFRESH_EVENT, { detail: { gameType } }));
}
