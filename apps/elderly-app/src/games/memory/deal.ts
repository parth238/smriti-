export type MotifId = "pot" | "calendar" | "tree" | "elephant" | "hills" | "bowl";

export const MOTIFS: MotifId[] = ["pot", "calendar", "tree", "elephant", "hills", "bowl"];

export type MemoryCard = {
  uid: string;
  motif: MotifId;
};

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = next[i];
    const right = next[j];
    if (left === undefined || right === undefined) {
      continue;
    }
    next[i] = right;
    next[j] = left;
  }
  return next;
}

export function dealMemoryCards(motifs: MotifId[] = MOTIFS.slice(0, 4)): MemoryCard[] {
  const doubled = [...motifs, ...motifs];
  return shuffle(doubled).map((motif, index) => ({
    uid: `${motif}-${index}`,
    motif,
  }));
}
