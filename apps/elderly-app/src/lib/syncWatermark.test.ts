import { afterEach, describe, expect, it } from "vitest";

import {
  SYNC_EPOCH_ISO,
  SYNC_REPLAY_OVERLAP_MS,
  clearStoredNextSince,
  readStoredNextSince,
  requestSinceFromStored,
  shouldAdvanceCursor,
  writeStoredNextSince,
} from "./syncWatermark";

const USER_A = "user-a";
const USER_B = "user-b";

describe("sync watermark", () => {
  afterEach(() => {
    clearStoredNextSince(USER_A);
    clearStoredNextSince(USER_B);
  });

  it("uses epoch on first pull", () => {
    expect(readStoredNextSince(USER_A)).toBeNull();
    expect(requestSinceFromStored(null)).toBe(SYNC_EPOCH_ISO);
  });

  it("scopes cursor independently per user", () => {
    writeStoredNextSince(USER_A, "2026-01-01T00:00:05.000Z", null);
    expect(readStoredNextSince(USER_A)).toBe("2026-01-01T00:00:05.000Z");
    expect(readStoredNextSince(USER_B)).toBeNull();
  });

  it("applies five second replay overlap on stored cursor", () => {
    const stored = "2026-01-01T00:00:10.000Z";
    const since = requestSinceFromStored(stored);
    const expectedMs = Date.parse(stored) - SYNC_REPLAY_OVERLAP_MS;
    expect(Date.parse(since)).toBe(expectedMs);
  });

  it("clamps replay overlap to epoch", () => {
    const stored = "1970-01-01T00:00:02.000Z";
    expect(requestSinceFromStored(stored)).toBe(SYNC_EPOCH_ISO);
  });

  it("falls back safely for invalid stored cursor", () => {
    localStorage.setItem(`smriti.sync.nextSince:${USER_A}`, "not-a-date");
    expect(readStoredNextSince(USER_A)).toBeNull();
    expect(localStorage.getItem(`smriti.sync.nextSince:${USER_A}`)).toBeNull();
    expect(requestSinceFromStored("bad")).toBe(SYNC_EPOCH_ISO);
  });

  it("does not move stored cursor backward", () => {
    writeStoredNextSince(USER_A, "2026-01-02T00:00:00.000Z", null);
    writeStoredNextSince(USER_A, "2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z");
    expect(readStoredNextSince(USER_A)).toBe("2026-01-02T00:00:00.000Z");
    expect(shouldAdvanceCursor("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z")).toBe(false);
  });
});
