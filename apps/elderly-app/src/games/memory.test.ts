import { describe, expect, it } from "vitest";

import { MOTIFS, dealMemoryCards } from "./memory";

describe("dealMemoryCards", () => {
  it("deals two of each motif for four pairs", () => {
    const four = MOTIFS.slice(0, 4);
    const cards = dealMemoryCards(four);
    expect(cards).toHaveLength(8);
    for (const motif of four) {
      expect(cards.filter((card) => card.motif === motif)).toHaveLength(2);
    }
  });

  it("supports five pairs without shrinking the deal", () => {
    const cards = dealMemoryCards(MOTIFS.slice(0, 5));
    expect(cards).toHaveLength(10);
  });
});
