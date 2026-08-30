import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { useAttentionGame } from "../../hooks/useAttentionGame";

export function AttentionGame() {
  const { tx } = useI18n();
  const { ready, slot, round, rounds, hint, tap, slots } = useAttentionGame();

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
      <Instruction>{hint}</Instruction>
      <ProgressDots total={rounds} filled={round} />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: slots }, (_, index) => (
          <button
            key={index}
            type="button"
            className="pressable garden-bed flex items-center justify-center"
            onClick={() => tap(index)}
            aria-label={tx("tapFlower")}
          >
            {slot === index ? <Motif id="flower" className="bloom h-24 w-24" /> : null}
          </button>
        ))}
      </div>
    </main>
  );
}
