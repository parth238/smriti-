import type { MemoryCard, MotifId } from "./deal";

export type FlipResult =
  | { kind: "wait" }
  | { kind: "match"; motif: MotifId }
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
  if (first.motif === second.motif) {
    return { kind: "match", motif: first.motif };
  }
  return { kind: "mismatch" };
}
