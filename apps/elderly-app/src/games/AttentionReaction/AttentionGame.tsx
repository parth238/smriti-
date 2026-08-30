import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { rememberGame } from "../../store/demoStore";
import { ATTENTION_ROUNDS, ATTENTION_SLOTS, flowerDelayMs, pickGardenSlot } from "../attention/logic";

export function AttentionGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"wait" | "tap" | "retry">("wait");

  useEffect(() => {
    rememberGame("/games/attention-reaction");
  }, []);

  useEffect(() => {
    if (round >= ATTENTION_ROUNDS) {
      navigate("/games/attention-reaction/result", { replace: true });
      return undefined;
    }
    let cancelled = false;
    setSlot(null);
    setPhase("wait");
    const appear = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setSlot(pickGardenSlot(ATTENTION_SLOTS));
      setPhase("tap");
    }, flowerDelayMs());
    return () => {
      cancelled = true;
      window.clearTimeout(appear);
    };
  }, [round, navigate]);

  function tap(index: number) {
    if (slot === null || index !== slot) {
      setPhase("retry");
      return;
    }
    setRound((current) => current + 1);
  }

  const hint =
    phase === "wait" ? tx("waitFlower") : phase === "retry" ? tx("tryAgainGentle") : tx("tapFlower");

  return (
    <main>
      <Chrome backTo="/games" />
      <Instruction>{hint}</Instruction>
      <ProgressDots total={ATTENTION_ROUNDS} filled={round} />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: ATTENTION_SLOTS }, (_, index) => (
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
