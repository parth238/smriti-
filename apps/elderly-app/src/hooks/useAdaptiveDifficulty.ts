import { useEffect, useState } from "react";

import { recentSessionsForGame } from "../db/syncOutbox";
import {
  DEFAULT_DIFFICULTY,
  attentionDelayMs,
  attentionRounds,
  memoryMismatchMs,
  memoryPairCount,
  namingItemCount,
  nextDifficulty,
  sequencingStepCount,
} from "../lib/adaptive";

export type AdaptiveProfile = {
  difficulty: number;
  pairCount: number;
  mismatchMs: number;
  flowerDelayMs: () => number;
  rounds: number;
  stepCount: number;
  namingCount: number;
  ready: boolean;
};

export function useAdaptiveDifficulty(gameType: string): AdaptiveProfile {
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await recentSessionsForGame(gameType);
      if (cancelled) {
        return;
      }
      const accuracies = rows.map((row) => row.accuracy);
      setDifficulty(nextDifficulty(DEFAULT_DIFFICULTY, accuracies));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [gameType]);

  return {
    difficulty,
    pairCount: memoryPairCount(difficulty),
    mismatchMs: memoryMismatchMs(difficulty),
    flowerDelayMs: () => attentionDelayMs(difficulty),
    rounds: attentionRounds(difficulty),
    stepCount: sequencingStepCount(difficulty),
    namingCount: namingItemCount(difficulty),
    ready,
  };
}
