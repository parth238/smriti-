import { describe, expect, it } from "vitest";

import { clockAngles } from "./useNow";

describe("clockAngles", () => {
  it("points both hands up at midnight", () => {
    expect(clockAngles(new Date(2026, 7, 30, 0, 0))).toEqual({ hour: 0, minute: 0 });
  });

  it("puts the minute hand at the bottom at half past", () => {
    const { hour, minute } = clockAngles(new Date(2026, 7, 30, 3, 30));
    expect(minute).toBe(180);
    expect(hour).toBe(105);
  });
});
