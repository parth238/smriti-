import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { GameSprite } from "../../components/GameSprite";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { useI18n } from "../../context/LanguageContext";
import {
  DAILY_STEPS,
  GAME_ASSETS,
  spriteIndex,
  type DailyStepId,
} from "../../data/gameAssets";
import { useSequencingGame } from "../../hooks/useSequencingGame";
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function SequencingGame() {
  const { tx } = useI18n();
  const { ready, order, steps, progress, stepCount, nudge, celebrate, tap } = useSequencingGame();
  useSpeakOnMount("sequenceHint", 500);
  useSpeakText(nudge, ready);

  if (!ready) {
    return (
      <main>
        <Chrome backTo="/games" />
        <div className="gamosa-line gamosa-draw mb-6" />
        <p className="text-body-lg text-mist-blue">{tx("gettingReady")}</p>
      </main>
    );
  }

  return (
    <main className="page-enter game-scene-sequencing">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={stepCount} filled={progress} />
      <div className="space-y-3">
        {order.map((step) => {
          const done = steps.indexOf(step) < progress;
          const iconIndex = spriteIndex(DAILY_STEPS, step as DailyStepId);
          return (
            <button
              key={step}
              type="button"
              disabled={done}
              className={`pressable flex min-h-[80px] w-full items-center gap-4 rounded-2xl px-4 text-left text-button-label transition-colors duration-200 ${
                done
                  ? "bg-tea-garden text-rice-white"
                  : celebrate && !done
                    ? "table-tile text-deep-hill ring-2 ring-marigold/40"
                    : "table-tile text-deep-hill"
              }`}
              onClick={() => tap(step)}
            >
              <GameSprite
                src={GAME_ASSETS.sequencingSheet}
                index={iconIndex}
                count={DAILY_STEPS.length}
                className="h-14 w-14 shrink-0"
              />
              <span>{tx(step)}</span>
            </button>
          );
        })}
      </div>
      <GameCompanion />
    </main>
  );
}
