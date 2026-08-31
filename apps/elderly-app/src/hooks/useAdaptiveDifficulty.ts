import { useCallback, useEffect, useState } from "react";

import { recentSessionsForGame } from "../db/syncOutbox";
import { ADAPTIVE_REFRESH_EVENT } from "../lib/adaptiveEvents";
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

  const reload = useCallback(async () => {
    const rows = await recentSessionsForGame(gameType);
    const accuracies = rows.map((row) => row.accuracy);
    setDifficulty(nextDifficulty(DEFAULT_DIFFICULTY, accuracies));
    setReady(true);
  }, [gameType]);

  useEffect(() => {
    let cancelled = false;
    void reload().then(() => {
      if (cancelled) {
        return;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    function onRecorded(event: Event) {
      const detail = (event as CustomEvent<{ gameType: string }>).detail;
      if (detail?.gameType === gameType) {
        void reload();
      }
    }
    window.addEventListener(ADAPTIVE_REFRESH_EVENT, onRecorded);
    return () => window.removeEventListener(ADAPTIVE_REFRESH_EVENT, onRecorded);
  }, [gameType, reload]);

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
