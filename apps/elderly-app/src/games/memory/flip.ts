import type { MemoryCard } from "./deal";

export type FlipResult =
  | { kind: "wait" }
  | { kind: "match"; matchKey: string }
  | { kind: "mismatch" };

export function evaluateFlip(cards: MemoryCard[], open: string[]): FlipResult {
  if (open.length < 2) {
    return { kind: "wait" };
  }
  const first = cards.find((item) => item.uid === open[0]);
  const second = cards.find((item) => item.uid === open[1]);
  if (!first || !second) {
    return { kind: "mismatch" };
  }
  if (first.matchKey === second.matchKey) {
    return { kind: "match", matchKey: first.matchKey };
  }
  return { kind: "mismatch" };
}
