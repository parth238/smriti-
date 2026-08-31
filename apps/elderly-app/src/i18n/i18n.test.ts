import { describe, expect, it } from "vitest";

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
});
