import { describe, expect, it } from "vitest";

import { MOTIFS, dealMemoryCards } from "./memory";

describe("dealMemoryCards", () => {
  it("deals two of each motif", () => {
    const cards = dealMemoryCards(MOTIFS);
    expect(cards).toHaveLength(8);
    for (const motif of MOTIFS) {
      expect(cards.filter((card) => card.motif === motif)).toHaveLength(2);
    }
  });
});
