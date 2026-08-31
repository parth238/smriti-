import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { Instruction } from "../../components/game/Instruction";
import { useI18n } from "../../context/LanguageContext";
import { usePathMazeGame } from "../../hooks/usePathMazeGame";
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function PathMazeGame() {
  const { tx } = useI18n();
  const { ready, size, pathKeys, hintCell, goal, nudge, tap } = usePathMazeGame();
  useSpeakOnMount("pathMazeHint", 500);
  useSpeakText(nudge, ready);

  if (!ready) {
    return (
      <main>
        <Chrome backTo="/games" />
        <p className="text-body-lg text-mist-blue">{tx("gettingReady")}</p>
      </main>
    );
  }

  return (
    <main className="page-enter game-scene-path-maze">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <div className="mx-auto grid gap-2" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, maxWidth: "20rem" }}>
        {Array.from({ length: size * size }, (_, i) => {
          const row = Math.floor(i / size);
          const col = i % size;
          const key = `${row}-${col}`;
          const onPath = pathKeys.has(key);
          const isStart = row === 0 && col === 0;
          const isGoal = row === goal.row && col === goal.col;
          const isHint = hintCell?.row === row && hintCell.col === col;
          return (
            <button
              key={key}
              type="button"
              className={`pressable aspect-square rounded-xl text-button-label ${
                onPath ? "bg-tea-garden text-rice-white" : isHint ? "ring-2 ring-marigold/60 table-tile" : "table-tile"
              }`}
              onClick={() => tap(row, col)}
              aria-label={isStart ? tx("pathStart") : isGoal ? tx("pathGoal") : tx("pathStep")}
            >
              {isStart ? "★" : isGoal ? "◎" : onPath ? "·" : ""}
            </button>
          );
        })}
      </div>
      <GameCompanion />
    </main>
  );
}
