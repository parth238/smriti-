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
import { useSpeakOnMount, useSpeakText } from "../../voice/CompanionVoice";

export function MemoryMatch() {
  const { tx } = useI18n();
  const { ready, cards, open, matched, pairCount, nudge, bloomKey, onTap } = useMemoryMatch();
  useSpeakOnMount("memoryHint", 500);
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
    <main className="game-scene-memory">
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={pairCount} filled={matched.length} />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const faceUp = open.includes(card.uid) || matched.includes(card.matchKey);
          const bloom = bloomKey === card.matchKey && matched.includes(card.matchKey);
          const iconIndex = card.motif ? spriteIndex(MEMORY_ICONS, card.motif as MemoryIconId) : 0;
          return (
            <button
              key={card.uid}
              type="button"
              className={`tile-flip pressable min-h-[132px] ${bloom ? "pair-bloom" : ""}`}
              aria-label={faceUp ? card.photoLabel ?? (card.motif ? tx(card.motif) : tx("memoryMatch")) : tx("memoryMatch")}
              onClick={() => onTap(card)}
            >
              <span className={`tile-flip-inner ${faceUp ? "is-up" : ""}`}>
                <span className="tile-flip-face tile-back" aria-hidden="true" />
                <span className="tile-flip-face tile-front flex items-center justify-center overflow-hidden">
                  {card.photoUrl ? (
                    <img
                      src={card.photoUrl}
                      alt={card.photoLabel ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GameSprite
                      src={GAME_ASSETS.memorySheet}
                      index={iconIndex}
                      count={MEMORY_ICONS.length}
                      className="h-20 w-20"
                    />
                  )}
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
