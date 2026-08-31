import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ATTENTION_ICONS, type AttentionIconId } from "../data/gameAssets";
import { ATTENTION_SLOTS, pickGardenSlot } from "../games/attention/logic";
import { useI18n } from "../context/LanguageContext";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

export function useAttentionGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("attention_reaction");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [slot, setSlot] = useState<number | null>(null);
  const [icon, setIcon] = useState<AttentionIconId | null>(null);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"wait" | "tap" | "retry">("wait");
  const errors = useRef(0);
  const reactions = useRef<number[]>([]);
  const shownAt = useRef(0);
  const flowerDelayMs = adaptive.flowerDelayMs;

  useEffect(() => {
    markStarted("/games/attention-reaction");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) {
      return undefined;
    }
    if (round >= adaptive.rounds) {
      const avgReaction =
        reactions.current.length > 0
          ? Math.round(
              reactions.current.reduce((sum, value) => sum + value, 0) /
                reactions.current.length,
            )
          : 1200;
      const accuracy = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (adaptive.rounds / Math.max(adaptive.rounds, adaptive.rounds + errors.current)) *
              100,
          ),
        ),
      );
      void recordResult({
        gameType: "attention_reaction",
        gamePath: "/games/attention-reaction",
        difficulty: adaptive.difficulty,
        accuracy,
        reactionTimeMs: avgReaction,
        errors: errors.current,
        sessionDurationSec: elapsedSec(),
      }).then(() => {
        navigate("/games/attention-reaction/result", { replace: true });
      });
      return undefined;
    }

    let cancelled = false;
    setSlot(null);
    setIcon(null);
    setPhase("wait");
    const appear = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      const nextIcon = ATTENTION_ICONS[Math.floor(Math.random() * ATTENTION_ICONS.length)] ?? "star";
      setIcon(nextIcon);
      setSlot(pickGardenSlot(ATTENTION_SLOTS));
      setPhase("tap");
      shownAt.current = Date.now();
    }, flowerDelayMs());

    return () => {
      cancelled = true;
      window.clearTimeout(appear);
    };
    // flowerDelayMs intentionally omitted — delay is sampled once per round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adaptive.difficulty,
    adaptive.ready,
    adaptive.rounds,
    elapsedSec,
    navigate,
    recordResult,
    round,
  ]);

  const tap = useCallback(
    (index: number) => {
      if (slot === null || index !== slot) {
        setPhase("retry");
        errors.current += 1;
        return;
      }
      reactions.current.push(Date.now() - shownAt.current);
      setRound((current) => current + 1);
    },
    [slot],
  );

  const hint =
    phase === "wait" ? tx("waitTarget") : phase === "retry" ? tx("tryAgainGentle") : tx("tapTarget");

  return {
    ready: adaptive.ready,
    slot,
    icon,
    round,
    rounds: adaptive.rounds,
    hint,
    tap,
    slots: ATTENTION_SLOTS,
  };
}
