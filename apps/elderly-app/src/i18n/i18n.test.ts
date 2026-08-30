import { describe, expect, it } from "vitest";

import { t } from "./index";

describe("i18n", () => {
  it("returns English and Assamese for the same key", () => {
    expect(t("en", "appName")).toBe("Smriti");
    expect(t("as", "appName")).toBe("স্মৃতি");
  });

  it("keeps warm copy without scores", () => {
    expect(t("en", "youDidWell")).toContain("wonderfully");
    expect(t("en", "tryAgainGentle")).toContain("try that again");
  });
});
