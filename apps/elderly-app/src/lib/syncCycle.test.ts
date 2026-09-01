import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authStorage from "./authStorage";
import { resetSyncCycleForTests, runSyncCycle } from "./syncCycle";
import {
  clearActiveSyncCycle,
  getActiveSyncCycle,
  setActiveSyncCycle,
} from "./syncCycleState";

const flushOutbox = vi.fn();
const pullServerChanges = vi.fn();

vi.mock("../db/syncOutbox", () => ({
  flushOutbox: (...args: unknown[]) => flushOutbox(...args),
}));

vi.mock("../db/syncPull", () => ({
  pullServerChanges: (...args: unknown[]) => pullServerChanges(...args),
}));

vi.mock("../i18n", () => ({
  readLanguage: () => "en",
}));

describe("sync cycle orchestration", () => {
  beforeEach(() => {
    resetSyncCycleForTests();
    flushOutbox.mockReset();
    pullServerChanges.mockReset();
    vi.stubGlobal("navigator", { onLine: true });
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue("token");
    vi.spyOn(authStorage, "readUserId").mockReturnValue("user-1");
  });

  it("attempts push before pull", async () => {
    const order: string[] = [];
    flushOutbox.mockImplementation(async () => {
      order.push("push");
      return 1;
    });
    pullServerChanges.mockImplementation(async () => {
      order.push("pull");
      return { remindersMerged: 0, memoriesMerged: 0, nextSince: "2026-01-01T00:00:00.000Z" };
    });

    await runSyncCycle();
    expect(order).toEqual(["push", "pull"]);
    expect(flushOutbox).toHaveBeenCalledWith("token", "user-1");
    expect(pullServerChanges).toHaveBeenCalledWith("token", "user-1", "en");
  });

  it("still pulls after failed push", async () => {
    flushOutbox.mockRejectedValueOnce(new Error("push failed"));
    pullServerChanges.mockResolvedValue({
      remindersMerged: 1,
      memoriesMerged: 0,
      nextSince: "2026-01-01T00:00:00.000Z",
    });

    await runSyncCycle();
    expect(flushOutbox).toHaveBeenCalledOnce();
    expect(pullServerChanges).toHaveBeenCalledOnce();
  });

  it("shares one active cycle for simultaneous triggers of the same user", async () => {
    let resolvePush: (value: number) => void = () => undefined;
    flushOutbox.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          resolvePush = resolve;
        }),
    );
    pullServerChanges.mockResolvedValue({
      remindersMerged: 0,
      memoriesMerged: 0,
      nextSince: "2026-01-01T00:00:00.000Z",
    });

    const first = runSyncCycle();
    const second = runSyncCycle();
    resolvePush(0);
    await Promise.all([first, second]);
    expect(flushOutbox).toHaveBeenCalledTimes(1);
    expect(pullServerChanges).toHaveBeenCalledTimes(1);
  });

  it("tracks active cycles independently per user", async () => {
    const cycleA = Promise.resolve({ flushed: 0 });
    const cycleB = Promise.resolve({ flushed: 1 });
    setActiveSyncCycle("user-a", cycleA);
    setActiveSyncCycle("user-b", cycleB);
    expect(getActiveSyncCycle("user-a")).toBe(cycleA);
    expect(getActiveSyncCycle("user-b")).toBe(cycleB);
    clearActiveSyncCycle("user-a", cycleA);
    expect(getActiveSyncCycle("user-a")).toBeUndefined();
    expect(getActiveSyncCycle("user-b")).toBe(cycleB);
  });

  it("runs when browser reconnects online", async () => {
    flushOutbox.mockResolvedValue(0);
    pullServerChanges.mockResolvedValue({
      remindersMerged: 0,
      memoriesMerged: 0,
      nextSince: "2026-01-01T00:00:00.000Z",
    });
    vi.stubGlobal("navigator", { onLine: false });
    await runSyncCycle();
    expect(flushOutbox).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", { onLine: true });
    await runSyncCycle();
    expect(flushOutbox).toHaveBeenCalledOnce();
  });
});
