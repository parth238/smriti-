import { Link } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { LargeButton } from "../../components/LargeButton";
import { useI18n } from "../../context/LanguageContext";
import { GAME_ASSETS } from "../../data/gameAssets";
import { useFaceRecallGame } from "../../hooks/useFaceRecallGame";
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function FaceRecallGame() {
  const { tx } = useI18n();
  const { ready, empty, current, index, total, nudge, choose } = useFaceRecallGame();
  useSpeakOnMount("faceRecallHint", 500);
  useSpeakText(nudge, ready);

  if (empty) {
    return (
      <main>
        <Chrome backTo="/games" />
        <Instruction>{tx("faceRecallHint")}</Instruction>
        <div className="photo-plate mb-6 flex items-center justify-center p-4">
          <img src={GAME_ASSETS.grandmother} alt="" className="h-40 w-40 object-contain" />
        </div>
        <p className="text-body-lg text-mist-blue">{tx("memoriesEmpty")}</p>
        <Link to="/memories/personal" className="mt-6 block">
          <LargeButton>{tx("myMemories")}</LargeButton>
        </Link>
        <GameCompanion />
      </main>
    );
  }

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
