export const ATTENTION_ROUNDS = 5;
export const ATTENTION_SLOTS = 4;

export function pickGardenSlot(slotCount = ATTENTION_SLOTS): number {
  return Math.floor(Math.random() * slotCount);
}

export function flowerDelayMs(): number {
  return 1100 + Math.random() * 700;
}
