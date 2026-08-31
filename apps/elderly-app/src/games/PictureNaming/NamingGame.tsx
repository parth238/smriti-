import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { GameSprite } from "../../components/GameSprite";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { LargeButton } from "../../components/LargeButton";
import { useI18n } from "../../context/LanguageContext";
import { GAME_ASSETS, NAMING_ICONS, spriteIndex } from "../../data/gameAssets";
import { useNamingGame } from "../../hooks/useNamingGame";
import { useCompanionVoice, useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function NamingGame() {
  const { tx } = useI18n();
  const { ready, current, index, total, nudge, reveal, choices, choose } = useNamingGame();
  const { voiceEnabled, listenAvailable, listenOnce, speakText } = useCompanionVoice();
  useSpeakOnMount("namingHint", 500);
  useSpeakText(nudge, ready);

  if (!ready || !current) {
    return (
      <main>
        <Chrome backTo="/games" />
        <div className="gamosa-line gamosa-draw mb-6" />
        <p className="text-body-lg text-mist-blue">{tx("gettingReady")}</p>
      </main>
    );
  }

  const iconIndex = spriteIndex(NAMING_ICONS, current.show);

  return (
    <main className="page-enter game-scene-naming">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={total} filled={index} />
      <div
        className={`photo-plate mb-8 flex items-center justify-center transition-opacity duration-300 ${reveal ? "opacity-100" : "opacity-0"}`}
      >
        <GameSprite
          src={GAME_ASSETS.namingSheet}
          index={iconIndex}
          count={NAMING_ICONS.length}
          className="h-32 w-32"
        />
      </div>
      <div className="space-y-4">
        {choices.map((choice) => (
          <LargeButton key={choice} tone="quiet" onClick={() => choose(choice)}>
            {tx(choice)}
          </LargeButton>
        ))}
        {voiceEnabled && listenAvailable ? (
          <LargeButton
            tone="quiet"
            onClick={() => {
              void listenOnce().then((said) => {
                if (said) {
                  speakText(said);
                }
              });
            }}
          >
            {tx("namingSpeak")}
          </LargeButton>
        ) : null}
      </div>
      <GameCompanion />
    </main>
  );
}
