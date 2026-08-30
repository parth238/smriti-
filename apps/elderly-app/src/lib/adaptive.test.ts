import { describe, expect, it } from "vitest";

import {
  DEFAULT_DIFFICULTY,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  memoryPairCount,
  nextDifficulty,
} from "./adaptive";

describe("nextDifficulty", () => {
  it("levels up after three strong rounds", () => {
    expect(nextDifficulty(3, [85, 90, 88])).toBe(4);
  });

  it("levels down after two poor rounds", () => {
    expect(nextDifficulty(3, [40, 45])).toBe(2);
  });

  it("clamps at edges", () => {
    expect(nextDifficulty(MAX_DIFFICULTY, [90, 92, 95])).toBe(MAX_DIFFICULTY);
    expect(nextDifficulty(MIN_DIFFICULTY, [10, 20])).toBe(MIN_DIFFICULTY);
  });

  it("keeps mid difficulty by default", () => {
    expect(nextDifficulty(DEFAULT_DIFFICULTY, [])).toBe(DEFAULT_DIFFICULTY);
  });
});

describe("memoryPairCount", () => {
  it("keeps tiles large (3 to 5 pairs)", () => {
    expect(memoryPairCount(1)).toBe(3);
    expect(memoryPairCount(3)).toBe(4);
    expect(memoryPairCount(5)).toBe(5);
  });
});
