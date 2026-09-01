import { describe, expect, it, vi } from "vitest";

import * as authStorage from "../lib/authStorage";
import { bumpAuthLoadGeneration } from "../lib/authLoadGeneration";
import { captureAuthScopedSnapshot, isAuthScopedSnapshotCurrent } from "../lib/authLoadScope";
import { shouldApplyAuthScopedResult } from "./hookAuthGuard";

describe("hook auth guard", () => {
  it("rejects stale results after generation bump", () => {
    const snapshot = { userId: "user-a", token: "token-a", generation: 1 };
    expect(shouldApplyAuthScopedResult(snapshot, "user-a", "token-a", 1)).toBe(true);
    expect(shouldApplyAuthScopedResult(snapshot, "user-a", "token-a", 2)).toBe(false);
    expect(shouldApplyAuthScopedResult(snapshot, "user-b", "token-a", 1)).toBe(false);
  });

  it("drops a delayed user-a load after switching to user-b", async () => {
    vi.spyOn(authStorage, "readUserId").mockReturnValue("user-a");
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue("token-a");
    const userASnapshot = captureAuthScopedSnapshot();

    let resolveUserA!: (value: string[]) => void;
    const delayedUserALoad = new Promise<string[]>((resolve) => {
      resolveUserA = resolve;
    });

    bumpAuthLoadGeneration();
    vi.spyOn(authStorage, "readUserId").mockReturnValue("user-b");
    vi.spyOn(authStorage, "readAccessToken").mockReturnValue("token-b");
    const userBSnapshot = captureAuthScopedSnapshot();

    const userBRows = ["user-b-row"];
    expect(isAuthScopedSnapshotCurrent(userBSnapshot)).toBe(true);
    expect(userBRows).toEqual(["user-b-row"]);

    resolveUserA(["user-a-row"]);
    const staleRows = await delayedUserALoad;
    expect(staleRows).toEqual(["user-a-row"]);
    expect(isAuthScopedSnapshotCurrent(userASnapshot)).toBe(false);
    expect(shouldApplyAuthScopedResult(userASnapshot, readUserId(), readAccessToken())).toBe(false);
  });
});

function readUserId(): string | null {
  return authStorage.readUserId();
}

function readAccessToken(): string | null {
  return authStorage.readAccessToken();
}
