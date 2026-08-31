/** Client-side staircase — mirrors backend adaptive_difficulty.py */

export const STRONG_ACCURACY_THRESHOLD = 80;
export const POOR_ACCURACY_THRESHOLD = 50;
export const ROUNDS_TO_LEVEL_UP = 3;
export const ROUNDS_TO_LEVEL_DOWN = 2;
export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 5;
export const DEFAULT_DIFFICULTY = 3;

export function clampDifficulty(level: number): number {
  return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, level));
}

export function nextDifficulty(
  currentDifficulty: number,
  recentAccuracies: number[],
): number {
  let level = clampDifficulty(currentDifficulty);
  let strongStreak = 0;
  let poorStreak = 0;

  for (const accuracy of recentAccuracies) {
    if (accuracy >= STRONG_ACCURACY_THRESHOLD) {
      strongStreak += 1;
      poorStreak = 0;
      if (strongStreak >= ROUNDS_TO_LEVEL_UP) {
        level = clampDifficulty(level + 1);
        strongStreak = 0;
      }
    } else if (accuracy <= POOR_ACCURACY_THRESHOLD) {
      poorStreak += 1;
      strongStreak = 0;
      if (poorStreak >= ROUNDS_TO_LEVEL_DOWN) {
        level = clampDifficulty(level - 1);
        poorStreak = 0;
      }
    } else {
      strongStreak = 0;
      poorStreak = 0;
    }
  }
  return level;
}

/** Memory Match: prefer 3–5 pairs so tiles stay large (2-column layout). */
export function memoryPairCount(difficulty: number): number {
  const level = clampDifficulty(difficulty);
  if (level <= 1) {
    return 3;
  }
  if (level === 2) {
    return 3;
  }
  if (level === 3) {
    return 4;
  }
  if (level === 4) {
    return 4;
  }
  return 5;
}

/** Mismatch lock / flip-back delay grows slightly with difficulty. */
export function memoryMismatchMs(difficulty: number): number {
  return 700 + clampDifficulty(difficulty) * 120;
}

/** Attention flower delay scales with difficulty (harder = longer wait band). */
export function attentionDelayMs(difficulty: number): number {
  const level = clampDifficulty(difficulty);
  const base = 900 + level * 180;
  return base + Math.random() * (400 + level * 80);
}

export function attentionRounds(difficulty: number): number {
  return 4 + Math.min(2, Math.max(0, clampDifficulty(difficulty) - 2));
}

/** Sequencing: fewer steps at lower difficulty (daily routine). */
export function sequencingStepCount(difficulty: number): number {
  const level = clampDifficulty(difficulty);
  if (level <= 2) {
    return 3;
  }
  if (level <= 4) {
    return 4;
  }
  return 5;
}

/** Picture naming: more rounds as difficulty rises. */
export function namingItemCount(difficulty: number): number {
  return Math.min(4, 2 + Math.max(0, clampDifficulty(difficulty) - 1));
}
