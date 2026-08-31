export type MotifId = "pot" | "calendar" | "tree" | "elephant" | "hills" | "bowl";

export const MOTIFS: MotifId[] = ["pot", "calendar", "tree", "elephant", "hills", "bowl"];

export type MemoryCard = {
  uid: string;
  matchKey: string;
  motif?: MotifId;
  photoUrl?: string;
  photoLabel?: string;
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

export type PhotoPairInput = {
  id: string;
  url: string;
  label: string;
};

export function dealMemoryCards(motifs: MotifId[] = MOTIFS.slice(0, 4)): MemoryCard[] {
  const doubled = [...motifs, ...motifs];
  return shuffle(doubled).map((motif, index) => ({
    uid: `${motif}-${index}`,
    matchKey: motif,
    motif,
  }));
}

/** Mix icon motifs with caregiver-uploaded family photo pairs when available. */
export function dealMemoryCardsMixed(
  pairCount: number,
  motifs: MotifId[],
  photos: PhotoPairInput[] = [],
): MemoryCard[] {
  const photoSlots = Math.min(photos.length, Math.max(0, Math.floor(pairCount / 2)));
  const iconPairs = Math.max(1, pairCount - photoSlots);
  const iconMotifs = motifs.slice(0, Math.min(motifs.length, iconPairs));
  const photoPick = shuffle(photos).slice(0, photoSlots);

  const cards: MemoryCard[] = [];
  for (const motif of iconMotifs) {
    for (let copy = 0; copy < 2; copy += 1) {
      cards.push({
        uid: `icon-${motif}-${copy}-${Math.random().toString(16).slice(2, 6)}`,
        matchKey: motif,
        motif,
      });
    }
  }
  for (const photo of photoPick) {
    for (let copy = 0; copy < 2; copy += 1) {
      cards.push({
        uid: `photo-${photo.id}-${copy}-${Math.random().toString(16).slice(2, 6)}`,
        matchKey: `photo:${photo.id}`,
        photoUrl: photo.url,
        photoLabel: photo.label,
      });
    }
  }
  return shuffle(cards);
}
