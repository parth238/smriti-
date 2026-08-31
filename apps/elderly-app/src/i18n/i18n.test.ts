import { describe, expect, it } from "vitest";

import enJson from "./en.json";
import asJson from "./as.json";
import { t } from "./index";

describe("i18n", () => {
  it("returns English and Assamese for the same key", () => {
    expect(t("en", "appName")).toBe("Smriti");
    expect(t("as", "appName")).toBe("স্মৃতি");
  });

  it("uses natural Assamese game labels", () => {
    expect(t("as", "memoryMatch")).toBe("স্মৃতি মিলোৱা");
    expect(t("as", "culturalRiver")).toBe("ব্ৰহ্মপুত্ৰ");
  });

  it("keeps warm copy without scores", () => {
    expect(t("en", "youDidWell")).toContain("wonderfully");
    expect(t("en", "tryAgainGentle")).toContain("try that again");
  });

  it("keeps en/as key parity", () => {
    const enKeys = Object.keys(enJson).sort();
    const asKeys = Object.keys(asJson).sort();
    expect(asKeys).toEqual(enKeys);
  });
});

describe("attention tap guard", () => {
  function shouldScoreError(phase: string, slot: number | null, tappedIndex: number): boolean {
    if (phase === "wait" || slot === null) {
      return false;
    }
    return tappedIndex !== slot;
  }

  it("ignores taps during wait phase", () => {
    expect(shouldScoreError("wait", null, 0)).toBe(false);
  });

  it("scores wrong tap only when target is visible", () => {
    expect(shouldScoreError("tap", 2, 0)).toBe(true);
    expect(shouldScoreError("tap", 2, 2)).toBe(false);
  });
});
