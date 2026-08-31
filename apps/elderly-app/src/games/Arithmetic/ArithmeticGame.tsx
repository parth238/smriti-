import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { LargeButton } from "../../components/LargeButton";
import { useI18n } from "../../context/LanguageContext";
import { useArithmeticGame } from "../../hooks/useArithmeticGame";
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function ArithmeticGame() {
  const { tx } = useI18n();
  const { ready, current, index, total, nudge, choose } = useArithmeticGame();
  useSpeakOnMount("arithmeticHint", 500);
  useSpeakText(nudge, ready);

  if (!ready || !current) {
    return (
      <main>
        <Chrome backTo="/games" />
        <p className="text-body-lg text-mist-blue">{tx("gettingReady")}</p>
      </main>
    );
  }

  return (
    <main className="page-enter">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={total} filled={index} />
      <div className="photo-plate mb-8 flex items-center justify-center">
        <p className="font-display text-display">{current.display} = ?</p>
      </div>
      <div className="space-y-4">
        {current.choices.map((choice) => (
          <LargeButton key={choice} tone="quiet" onClick={() => choose(choice)}>
            {choice}
          </LargeButton>
        ))}
      </div>
      <GameCompanion />
    </main>
  );
}
