import type { GameSessionInput } from "../types/gameSession";

type ActiveGame = {
  gameType: string;
  gamePath: string;
  difficulty: number;
  started: boolean;
  completed: boolean;
  recordQuit: (input: Omit<GameSessionInput, "completedOrQuit">) => Promise<void>;
};

let active: ActiveGame | null = null;

export function registerActiveGame(game: ActiveGame): void {
  active = game;
}

export function markActiveGameCompleted(): void {
  if (active) {
    active.completed = true;
  }
}

export function clearActiveGame(): void {
  active = null;
}

export async function quitActiveGameIfNeeded(): Promise<void> {
  if (!active || active.completed || !active.started) {
    active = null;
    return;
  }
  const snapshot = active;
  active = null;
  await snapshot.recordQuit({
    gameType: snapshot.gameType,
    gamePath: snapshot.gamePath,
    difficulty: snapshot.difficulty,
    accuracy: 0,
    reactionTimeMs: 0,
    errors: 0,
    hintsUsed: 0,
    sessionDurationSec: 1,
  });
}
