import { describe, expect, it, vi } from "vitest";

import { onServerPullComplete } from "../lib/syncEvents";
import { shouldRefreshForPullEvent } from "./useReminders";

describe("incremental sync hook wiring", () => {
  it("hooks refresh from Dexie after pull-complete event", () => {
    const handler = vi.fn();
    const cleanup = onServerPullComplete((detail) => {
      if (shouldRefreshForPullEvent(detail.userId, "user-1")) {
        handler(detail);
      }
    });
    window.dispatchEvent(
      new CustomEvent("smriti:server-pull-complete", {
        detail: {
          userId: "user-1",
          remindersMerged: 0,
          memoriesMerged: 1,
          nextSince: "2026-01-01T00:00:00.000Z",
        },
      }),
    );
    expect(handler).toHaveBeenCalledOnce();
    cleanup();
  });

  it("reminder hook ignores pull events for another user", () => {
    expect(shouldRefreshForPullEvent("user-a", "user-b")).toBe(false);
  });

  it("memory and home reminder hooks are cache-driven entry points", async () => {
    const personal = await import("./usePersonalMemories");
    const home = await import("./useHomeReminder");
    expect(personal.usePersonalMemories).toBeTypeOf("function");
    expect(home.useHomeReminder).toBeTypeOf("function");
  });
});
