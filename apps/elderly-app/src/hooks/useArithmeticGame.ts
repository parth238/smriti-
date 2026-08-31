import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../context/LanguageContext";
import { arithmeticRounds } from "../lib/adaptive";
import { buildArithmeticProblem, formatProblem } from "../games/Arithmetic/logic";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

export function useArithmeticGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("simple_arithmetic");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState("");
  const errors = useRef(0);
  const problems = useMemo(
    () => Array.from({ length: arithmeticRounds(adaptive.difficulty) }, () => buildArithmeticProblem(adaptive.difficulty)),
    [adaptive.difficulty, adaptive.ready],
  );
  const current = problems[index]
    ? { display: formatProblem(problems[index]), answer: problems[index].answer, choices: problems[index].choices }
    : null;

  useEffect(() => {
    markStarted("/games/arithmetic");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) return;
    setIndex(0);
    setNudge("");
    errors.current = 0;
  }, [adaptive.ready, problems]);

  const choose = useCallback(
    (value: number) => {
      if (!current || value !== current.answer) {
        setNudge(tx("tryAgainGentle"));
        if (current) errors.current += 1;
        return;
      }
      if (index + 1 >= problems.length) {
        void recordResult({
          gameType: "simple_arithmetic",
          gamePath: "/games/arithmetic",
          difficulty: adaptive.difficulty,
          accuracy: Math.max(0, Math.min(100, Math.round((problems.length / (problems.length + errors.current)) * 100))),
          reactionTimeMs: Math.round((elapsedSec() * 1000) / problems.length),
          errors: errors.current,
          sessionDurationSec: elapsedSec(),
        }).then(() => navigate("/games/arithmetic/result", { replace: true }));
        return;
      }
      setNudge("");
      setIndex((v) => v + 1);
    },
    [adaptive.difficulty, current, elapsedSec, index, navigate, problems.length, recordResult, tx],
  );

  return {
    ready: adaptive.ready && Boolean(current),
    current,
    index,
    total: problems.length,
    nudge: nudge || tx("arithmeticHint"),
    choose,
  };
}
