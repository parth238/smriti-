import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../context/LanguageContext";
import { shuffle } from "../games/memory";
import { TEA_STEPS, type TeaStepId } from "../games/Sequencing/steps";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

export function useSequencingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("sequencing");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [progress, setProgress] = useState(0);
  const [nudge, setNudge] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const errors = useRef(0);
  const finished = useRef(false);

  const steps = useMemo(
    () => TEA_STEPS.slice(0, adaptive.stepCount),
    [adaptive.stepCount],
  );
  const [order, setOrder] = useState<TeaStepId[]>([]);

  useEffect(() => {
    markStarted("/games/sequencing");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) {
      return;
    }
    setOrder(shuffle([...steps]));
    setProgress(0);
    setNudge("");
    errors.current = 0;
    finished.current = false;
    setCelebrate(false);
  }, [adaptive.ready, steps]);

  const tap = useCallback(
    (step: TeaStepId) => {
      if (finished.current) {
        return;
      }
      if (step !== steps[progress]) {
        setNudge(tx("tryAgainGentle"));
        errors.current += 1;
        return;
      }
      const next = progress + 1;
      setProgress(next);
      setNudge("");
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 260);
      if (next === steps.length) {
        finished.current = true;
        const accuracy = Math.max(
          0,
          Math.min(
            100,
            Math.round((steps.length / Math.max(steps.length, steps.length + errors.current)) * 100),
          ),
        );
        void recordResult({
          gameType: "sequencing",
          gamePath: "/games/sequencing",
          difficulty: adaptive.difficulty,
          accuracy,
          reactionTimeMs: Math.round((elapsedSec() * 1000) / steps.length),
          errors: errors.current,
          sessionDurationSec: elapsedSec(),
        }).then(() => {
          navigate("/games/sequencing/result", { replace: true });
        });
      }
    },
    [adaptive.difficulty, elapsedSec, navigate, progress, recordResult, steps, tx],
  );

  return {
    ready: adaptive.ready && order.length > 0,
    order,
    steps,
    progress,
    stepCount: steps.length,
    nudge: nudge || tx("sequenceHint"),
    celebrate,
    tap,
  };
}
