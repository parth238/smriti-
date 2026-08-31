import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { LargeButton } from "../../components/LargeButton";
import { useI18n } from "../../context/LanguageContext";
import { useFaceRecallGame } from "../../hooks/useFaceRecallGame";
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function FaceRecallGame() {
  const { tx } = useI18n();
  const { ready, current, index, total, nudge, choose } = useFaceRecallGame();
  useSpeakOnMount("faceRecallHint", 500);
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
      <div className="photo-plate mb-6 overflow-hidden p-0">
        <img src={current.url} alt={current.name} className="w-full object-cover" style={{ minHeight: "12rem" }} />
      </div>
      <p className="mb-4 text-body-lg">{tx("whoIsThis")}</p>
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
