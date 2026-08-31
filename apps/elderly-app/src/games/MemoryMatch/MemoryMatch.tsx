import { Chrome } from "../../components/Chrome";
import { GameCompanion } from "../../components/companion/GameCompanion";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { useMemoryMatch } from "../../hooks/useMemoryMatch";

export function MemoryMatch() {
  const { tx } = useI18n();
  const { ready, cards, open, matched, pairCount, nudge, bloomMotif, onTap } = useMemoryMatch();

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
    <main>
      <Chrome backTo="/games" />
      <Instruction>{nudge}</Instruction>
      <ProgressDots total={pairCount} filled={matched.length} />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const faceUp = open.includes(card.uid) || matched.includes(card.motif);
          const bloom = bloomMotif === card.motif && matched.includes(card.motif);
          return (
            <button
              key={card.uid}
              type="button"
              className={`tile-flip pressable min-h-[132px] ${bloom ? "pair-bloom" : ""}`}
              aria-label={faceUp ? card.motif : tx("memoryMatch")}
              onClick={() => onTap(card)}
            >
              <span className={`tile-flip-inner ${faceUp ? "is-up" : ""}`}>
                <span className="tile-flip-face tile-back" aria-hidden="true" />
                <span className="tile-flip-face tile-front">
                  <Motif id={card.motif} className="h-20 w-20" />
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
