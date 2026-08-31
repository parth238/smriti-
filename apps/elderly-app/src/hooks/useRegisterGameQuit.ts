import { useEffect } from "react";

import { clearActiveGame, registerActiveGame } from "../lib/gameSessionRegistry";
import type { GameSessionInput } from "./useGameSession";

type RegisterArgs = {
  gameType: string;
  gamePath: string;
  difficulty: number;
  recordResult: (input: GameSessionInput) => Promise<void>;
  elapsedSec: () => number;
};

export function useRegisterGameQuit({
  gameType,
  gamePath,
  difficulty,
  recordResult,
  elapsedSec,
}: RegisterArgs) {
  useEffect(() => {
    registerActiveGame({
      gameType,
      gamePath,
      difficulty,
      started: true,
      completed: false,
      recordQuit: async (input) => {
        await recordResult({ ...input, completedOrQuit: "quit", sessionDurationSec: elapsedSec() });
      },
    });
    return () => clearActiveGame();
  }, [difficulty, elapsedSec, gamePath, gameType, recordResult]);
}
