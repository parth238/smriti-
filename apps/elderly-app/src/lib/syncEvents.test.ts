import { describe, expect, it, vi } from "vitest";

import {
  SERVER_PULL_COMPLETE_EVENT,
  dispatchServerPullComplete,
  onServerPullComplete,
} from "./syncEvents";
import { shouldRefreshForPullEvent } from "../hooks/useReminders";

describe("server pull complete event", () => {
  it("dispatches typed cache-change metadata", () => {
    const handler = vi.fn();
    const cleanup = onServerPullComplete(handler);
    dispatchServerPullComplete({
      userId: "user-a",
      remindersMerged: 2,
      memoriesMerged: 1,
      nextSince: "2026-01-01T00:00:00.000Z",
    });
    expect(handler).toHaveBeenCalledWith({
      userId: "user-a",
      remindersMerged: 2,
      memoriesMerged: 1,
      nextSince: "2026-01-01T00:00:00.000Z",
    });
    cleanup();
  });

  it("does not refresh another user cache", () => {
    expect(shouldRefreshForPullEvent("user-a", "user-b")).toBe(false);
    expect(shouldRefreshForPullEvent("user-a", "user-a")).toBe(true);
  });

  it("uses stable event name", () => {
    expect(SERVER_PULL_COMPLETE_EVENT).toBe("smriti:server-pull-complete");
  });
});
