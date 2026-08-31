import { useEffect } from "react";

import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { GameSprite } from "../../components/GameSprite";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { useI18n } from "../../context/LanguageContext";
import {
  GAME_ASSETS,
  MEMORY_ICONS,
  spriteIndex,
  type MemoryIconId,
} from "../../data/gameAssets";
import { useMemoryMatch } from "../../hooks/useMemoryMatch";
import { useCompanionVoice } from "../../voice/CompanionVoice";

export function MemoryMatch() {
  const { tx } = useI18n();
  const { ready, cards, open, matched, pairCount, nudge, bloomMotif, onTap } = useMemoryMatch();
  const { voiceEnabled, speakKey } = useCompanionVoice();

  useEffect(() => {
    if (!ready || !voiceEnabled) {
      return undefined;
    }
    const timer = window.setTimeout(() => speakKey("memoryHint"), 500);
    return () => window.clearTimeout(timer);
  }, [ready, speakKey, voiceEnabled]);

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
    <main className="game-scene-memory">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={pairCount} filled={matched.length} />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const faceUp = open.includes(card.uid) || matched.includes(card.motif);
          const bloom = bloomMotif === card.motif && matched.includes(card.motif);
          const iconIndex = spriteIndex(MEMORY_ICONS, card.motif as MemoryIconId);
          return (
            <button
              key={card.uid}
              type="button"
              className={`tile-flip pressable min-h-[132px] ${bloom ? "pair-bloom" : ""}`}
              aria-label={faceUp ? tx(card.motif) : tx("memoryMatch")}
              onClick={() => onTap(card)}
            >
              <span className={`tile-flip-inner ${faceUp ? "is-up" : ""}`}>
                <span className="tile-flip-face tile-back" aria-hidden="true" />
                <span className="tile-flip-face tile-front flex items-center justify-center">
                  <GameSprite
                    src={GAME_ASSETS.memorySheet}
                    index={iconIndex}
                    count={MEMORY_ICONS.length}
                    className="h-20 w-20"
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <GameCompanion />
    </main>
  );
}
