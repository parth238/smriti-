import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "../../../../packages/shared-types/src/index";

const BACKEND_CANONICAL_GAME_TYPES = [
  "memory_match",
  "attention_reaction",
  "sequencing",
  "picture_naming",
  "simple_arithmetic",
  "path_maze",
  "face_recall",
] as const;

const ORIGINAL_FOUR_GAME_TYPES = [
  "memory_match",
  "attention_reaction",
  "sequencing",
  "picture_naming",
] as const;

describe("shared GameType contract", () => {
  it("lists exactly seven unique canonical backend values", () => {
    expect(GAME_TYPES).toHaveLength(7);
    expect(new Set(GAME_TYPES).size).toBe(7);
    expect([...GAME_TYPES].sort()).toEqual([...BACKEND_CANONICAL_GAME_TYPES].sort());
  });

  it("preserves the original four valid values", () => {
    for (const gameType of ORIGINAL_FOUR_GAME_TYPES) {
      expect(GAME_TYPES).toContain(gameType);
    }
  });

  it("keeps the runtime tuple aligned with the exported union", () => {
    const fromTuple: (typeof GAME_TYPES)[number][] = [...GAME_TYPES];
    expect(fromTuple.every((value) => BACKEND_CANONICAL_GAME_TYPES.includes(value))).toBe(true);
  });
});
