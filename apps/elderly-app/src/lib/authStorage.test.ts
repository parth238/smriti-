import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_SESSION_CHANGED_EVENT, persistAuthSession } from "./authStorage";
import { getActiveSyncCycle, resetSyncCycleForTests, setActiveSyncCycle } from "./syncCycleState";

describe("auth session event ordering", () => {
  beforeEach(() => {
    resetSyncCycleForTests();
    vi.restoreAllMocks();
  });

  it("invalidates active sync cycles before auth listeners run", () => {
    const staleCycle = Promise.resolve({ flushed: 0 });
    setActiveSyncCycle("user-a", staleCycle);

    let cycleDuringEvent: Promise<{ flushed: number }> | undefined;
    const listener = () => {
      cycleDuringEvent = getActiveSyncCycle("user-a");
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, listener);

    persistAuthSession("token-b", "user-b");

    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, listener);
    expect(cycleDuringEvent).toBeUndefined();
    expect(getActiveSyncCycle("user-a")).toBeUndefined();
  });
});
