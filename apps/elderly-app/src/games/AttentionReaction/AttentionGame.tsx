import { Chrome } from "../../components/Chrome";

import { GameCompanion } from "../../components/companion/GameCompanion";

import { GameSprite } from "../../components/GameSprite";

import { Instruction } from "../../components/game/Instruction";

import { ProgressDots } from "../../components/game/ProgressDots";

import { useI18n } from "../../context/LanguageContext";

import {
  ATTENTION_ICONS,
  GAME_ASSETS,
  spriteIndex,
} from "../../data/gameAssets";

import { useAttentionGame } from "../../hooks/useAttentionGame";
import { useSpeakText } from "../../voice/CompanionVoice";

export function AttentionGame() {
  const { tx } = useI18n();
  const { ready, slot, icon, round, rounds, hint, tap, slots } = useAttentionGame();
  useSpeakText(hint, ready);



  if (!ready) {

    return (

      <main>

        <Chrome backTo="/games" />

        <div className="gamosa-line gamosa-draw mb-6" />

        <p className="text-body-lg text-mist-blue">{tx("gettingReady")}</p>

      </main>

    );

  }



  const activeIndex = icon ? spriteIndex(ATTENTION_ICONS, icon) : 0;



  return (

    <main className="game-scene-attention">

      <Chrome backTo="/games" />

      <Instruction>{hint}</Instruction>

      <ProgressDots total={rounds} filled={round} />

      <div className="grid grid-cols-2 gap-4">

        {Array.from({ length: slots }, (_, index) => (

          <button

            key={index}

            type="button"

            className={`pressable garden-bed flex items-center justify-center ${slot === index ? "ring-2 ring-marigold/50" : ""}`}

            onClick={() => tap(index)}

            aria-label={tx("tapTarget")}

          >

            {slot === index && icon ? (

              <GameSprite

                src={GAME_ASSETS.attentionSheet}

                index={activeIndex}

                count={ATTENTION_ICONS.length}

                className="bloom h-24 w-24"

              />

            ) : null}

          </button>

        ))}

      </div>

      <GameCompanion />

    </main>

  );

}

