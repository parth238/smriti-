export type GameSessionInput = {
  gameType: string;
  gamePath: string;
  difficulty: number;
  accuracy: number;
  reactionTimeMs: number;
  errors: number;
  hintsUsed?: number;
  sessionDurationSec: number;
  completedOrQuit?: "completed" | "quit";
};
