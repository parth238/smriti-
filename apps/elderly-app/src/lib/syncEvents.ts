export const SERVER_PULL_COMPLETE_EVENT = "smriti:server-pull-complete";

export type ServerPullCompleteDetail = {
  userId: string;
  remindersMerged: number;
  memoriesMerged: number;
  nextSince: string;
};

export function dispatchServerPullComplete(detail: ServerPullCompleteDetail): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(SERVER_PULL_COMPLETE_EVENT, { detail }));
}

export function onServerPullComplete(
  handler: (detail: ServerPullCompleteDetail) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const listener = (event: Event) => {
    const custom = event as CustomEvent<ServerPullCompleteDetail>;
    if (!custom.detail?.userId) {
      return;
    }
    handler(custom.detail);
  };
  window.addEventListener(SERVER_PULL_COMPLETE_EVENT, listener);
  return () => window.removeEventListener(SERVER_PULL_COMPLETE_EVENT, listener);
}
