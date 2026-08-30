import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { TeaStep } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { useGameSession } from "../../hooks/useGameSession";
import { shuffle } from "../memory";
import { TEA_STEPS, type TeaStepId } from "./steps";

export function SequencingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [order] = useState(() => shuffle([...TEA_STEPS]));
  const [progress, setProgress] = useState(0);
  const [nudge, setNudge] = useState("");
  const errors = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    markStarted("/games/sequencing");
  }, [markStarted]);

  function tap(step: TeaStepId) {
    if (finished.current) {
      return;
    }
    if (step !== TEA_STEPS[progress]) {
      setNudge(tx("tryAgainGentle"));
      errors.current += 1;
      return;
    }
    const next = progress + 1;
    setProgress(next);
    setNudge("");
    if (next === TEA_STEPS.length) {
      finished.current = true;
      const accuracy = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (TEA_STEPS.length / Math.max(TEA_STEPS.length, TEA_STEPS.length + errors.current)) *
              100,
          ),
        ),
      );
      void recordResult({
        gameType: "sequencing",
        gamePath: "/games/sequencing",
        difficulty: 3,
        accuracy,
        reactionTimeMs: Math.round((elapsedSec() * 1000) / TEA_STEPS.length),
        errors: errors.current,
        sessionDurationSec: elapsedSec(),
      }).then(() => {
        navigate("/games/sequencing/result", { replace: true });
      });
    }
  }

  return (
    <main>
      <Chrome backTo="/games" />
      <Instruction>{nudge || tx("sequenceHint")}</Instruction>
      <ProgressDots total={4} filled={progress} />
      <div className="space-y-3">
        {order.map((step) => {
          const done = TEA_STEPS.indexOf(step) < progress;
          return (
            <button
              key={step}
              type="button"
              disabled={done}
              className={`pressable flex min-h-[80px] w-full items-center gap-4 rounded-2xl px-4 text-left text-button-label ${
                done ? "bg-tea-garden text-rice-white" : "table-tile text-deep-hill"
              }`}
              onClick={() => tap(step)}
            >
              <TeaStep id={step} className="h-12 w-12 shrink-0" />
              <span>{tx(step)}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
