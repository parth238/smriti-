import { describe, expect, it } from "vitest";

import { evaluateFlip } from "./flip";
import type { MemoryCard } from "./deal";

const cards: MemoryCard[] = [
  { uid: "a", motif: "tea" },
  { uid: "b", motif: "tea" },
  { uid: "c", motif: "bird" },
];

describe("evaluateFlip", () => {
  it("waits for the second tile", () => {
    expect(evaluateFlip(cards, ["a"])).toEqual({ kind: "wait" });
  });

  it("matches a pair", () => {
    expect(evaluateFlip(cards, ["a", "b"])).toEqual({ kind: "match", motif: "tea" });
  });

  it("treats different motifs as a gentle miss", () => {
    expect(evaluateFlip(cards, ["a", "c"])).toEqual({ kind: "mismatch" });
  });
});
