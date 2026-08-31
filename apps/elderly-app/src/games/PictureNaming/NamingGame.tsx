import { useState } from "react";

import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { GameSprite } from "../../components/GameSprite";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { LargeButton } from "../../components/LargeButton";
import { useI18n } from "../../context/LanguageContext";
import type { MessageKey } from "../../i18n";
import { GAME_ASSETS, NAMING_ICONS, spriteIndex } from "../../data/gameAssets";
import { useNamingGame } from "../../hooks/useNamingGame";
import { useCompanionVoice, useSpeakText } from "../../voice/CompanionVoice";

function spokenMatches(transcript: string, key: MessageKey, tx: (k: MessageKey) => string): boolean {
  const expected = tx(key).toLowerCase().replace(/[^a-z0-9\u0980-\u09FF\s]/gi, "");
  const said = transcript.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF\s]/gi, "");
  if (!expected || !said) {
    return false;
  }
  return said.includes(expected) || expected.includes(said);
}

export function NamingGame() {
  const { tx, language } = useI18n();
  const { ready, current, index, total, nudge, reveal, choices, choose } = useNamingGame();
  const { voiceEnabled, listenAvailable, listenOnce } = useCompanionVoice();
  const [voiceNudge, setVoiceNudge] = useState("");
  useSpeakText(voiceNudge || nudge, ready);

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
  const showVoiceButton = voiceEnabled && listenAvailable && language === "en";

  return (
    <main className="page-enter game-scene-naming">
      <Chrome backTo="/games" />
      <Instruction>{voiceNudge || nudge}</Instruction>
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
        {showVoiceButton ? (
          <LargeButton
            tone="quiet"
            onClick={() => {
              setVoiceNudge("");
              void listenOnce().then((said) => {
                if (!said) {
                  setVoiceNudge(tx("tryAgainGentle"));
                  return;
                }
                if (spokenMatches(said, current.yes, tx)) {
                  choose(current.yes);
                } else {
                  setVoiceNudge(tx("tryAgainGentle"));
                }
              });
            }}
          >
            {tx("namingSpeak")}
          </LargeButton>
        ) : null}
        {language === "as" && voiceEnabled ? (
          <p className="text-body text-mist-blue">{tx("voiceListenEnglishNote")}</p>
        ) : null}
      </div>
      <GameCompanion />
    </main>
  );
}
