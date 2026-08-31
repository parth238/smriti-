import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useI18n } from "../context/LanguageContext";
import { NAMING_ITEMS, type NameKey } from "../games/PictureNaming/items";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

export function useNamingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("picture_naming");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState("");
  const [reveal, setReveal] = useState(false);
  const errors = useRef(0);

  const rounds = useMemo(
    () => NAMING_ITEMS.slice(0, adaptive.namingCount),
    [adaptive.namingCount],
  );
  const current = rounds[index];

  useEffect(() => {
    markStarted("/games/picture-naming");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) {
      return;
    }
    setIndex(0);
    setNudge("");
    errors.current = 0;
    setReveal(false);
  }, [adaptive.ready, rounds]);

  useEffect(() => {
    if (!current) {
      return undefined;
    }
    setReveal(false);
    const timer = window.setTimeout(() => setReveal(true), 220);
    return () => window.clearTimeout(timer);
  }, [current, index]);

  const choose = useCallback(
    (key: NameKey) => {
      if (!current) {
        return;
      }
      if (key !== current.yes) {
        setNudge(tx("tryAgainGentle"));
        errors.current += 1;
        return;
      }
      if (index + 1 >= rounds.length) {
        const total = rounds.length;
        const accuracy = Math.max(
          0,
          Math.min(100, Math.round((total / Math.max(total, total + errors.current)) * 100)),
        );
        void recordResult({
          gameType: "picture_naming",
          gamePath: "/games/picture-naming",
          difficulty: adaptive.difficulty,
          accuracy,
          reactionTimeMs: Math.round((elapsedSec() * 1000) / total),
          errors: errors.current,
          sessionDurationSec: elapsedSec(),
        }).then(() => {
          navigate("/games/picture-naming/result", { replace: true });
        });
        return;
      }
      setNudge("");
      setIndex((value) => value + 1);
    },
    [adaptive.difficulty, current, elapsedSec, index, navigate, recordResult, rounds.length, tx],
  );

  const choices = current
    ? index % 2 === 0
      ? [current.yes, current.no]
      : [current.no, current.yes]
    : [];

  return {
    ready: adaptive.ready && Boolean(current),
    current,
    index,
    total: rounds.length,
    nudge: nudge || tx("namingHint"),
    reveal,
    choices,
    choose,
  };
}
