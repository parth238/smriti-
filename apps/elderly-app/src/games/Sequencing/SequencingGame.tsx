import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { TeaStep } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { shuffle } from "../memory";
import { rememberGame } from "../../store/demoStore";
import { TEA_STEPS, type TeaStepId } from "./steps";

export function SequencingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [order] = useState(() => shuffle([...TEA_STEPS]));
  const [progress, setProgress] = useState(0);
  const [nudge, setNudge] = useState("");

  useEffect(() => {
    rememberGame("/games/sequencing");
  }, []);

  function tap(step: TeaStepId) {
    if (step !== TEA_STEPS[progress]) {
      setNudge(tx("tryAgainGentle"));
      return;
    }
    const next = progress + 1;
    setProgress(next);
    setNudge("");
    if (next === TEA_STEPS.length) {
      navigate("/games/sequencing/result", { replace: true });
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
