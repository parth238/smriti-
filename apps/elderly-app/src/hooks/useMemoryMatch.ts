import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadFamilyMemories, resolveMediaUrl } from "../api/memories";
import { useI18n } from "../context/LanguageContext";
import { MOTIF_MEMORY_PROMPTS } from "../data/motifPrompts";
import { dealMemoryCardsMixed, evaluateFlip, MOTIFS, type MemoryCard } from "../games/memory";
import type { MotifId } from "../games/memory/deal";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

function motifsForPairs(pairCount: number): MotifId[] {
  return MOTIFS.slice(0, Math.min(MOTIFS.length, Math.max(3, pairCount)));
}

export function useMemoryMatch() {
  const { tx, language } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("memory_match");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [nudge, setNudge] = useState("");
  const [bloomKey, setBloomKey] = useState<string | null>(null);
  const errors = useRef(0);
  const flips = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    markStarted("/games/memory-match");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const family = await loadFamilyMemories();
      if (cancelled) {
        return;
      }
      const photos = family.slice(0, 3).map((item) => ({
        id: item.id,
        url: resolveMediaUrl(item.media_url),
        label: item.title[language] ?? item.title.en ?? item.title.as ?? "Family",
      }));
      setCards(
        dealMemoryCardsMixed(adaptive.pairCount, motifsForPairs(adaptive.pairCount), photos),
      );
      setOpen([]);
      setMatched([]);
      setNudge("");
      errors.current = 0;
      flips.current = 0;
      finished.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [adaptive.pairCount, adaptive.ready, language]);

  useEffect(() => {
    if (!adaptive.ready || matched.length === 0 || matched.length < adaptive.pairCount) {
      return undefined;
    }
    if (finished.current) {
      return undefined;
    }
    finished.current = true;
    setNudge(tx("allPairs"));
    const totalPairs = adaptive.pairCount;
    const accuracy = Math.max(
      0,
      Math.min(100, Math.round((totalPairs / Math.max(totalPairs, flips.current / 2)) * 100)),
    );
    const timer = window.setTimeout(() => {
      void recordResult({
        gameType: "memory_match",
        gamePath: "/games/memory-match",
        difficulty: adaptive.difficulty,
        accuracy,
        reactionTimeMs: Math.round((elapsedSec() * 1000) / Math.max(1, totalPairs)),
        errors: errors.current,
        sessionDurationSec: elapsedSec(),
      }).then(() => {
        navigate("/games/memory-match/result", { replace: true });
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    adaptive.difficulty,
    adaptive.pairCount,
    adaptive.ready,
    elapsedSec,
    matched.length,
    navigate,
    recordResult,
    tx,
  ]);

  const onTap = useCallback(
    (card: MemoryCard) => {
      if (locked || open.includes(card.uid) || matched.includes(card.matchKey) || !cards.length) {
        return;
      }
      const next = [...open, card.uid];
      setOpen(next);
      setNudge("");
      const result = evaluateFlip(cards, next);
      if (result.kind === "wait") {
        return;
      }
      flips.current += 1;
      if (result.kind === "match") {
        setMatched((current) => [...current, result.matchKey]);
        setOpen([]);
        setBloomKey(result.matchKey);
        if (card.photoLabel) {
          setNudge(`${tx("pairFound")} ${card.photoLabel}`);
        } else if (card.motif) {
          const promptKey = MOTIF_MEMORY_PROMPTS[card.motif];
          setNudge(`${tx("pairFound")} ${tx(promptKey)}`);
        } else {
          setNudge(tx("pairFound"));
        }
        window.setTimeout(() => setBloomKey(null), 480);
        return;
      }
      errors.current += 1;
      setLocked(true);
      setNudge(tx("tryAgainGentle"));
      window.setTimeout(() => {
        setOpen([]);
        setLocked(false);
      }, adaptive.mismatchMs);
    },
    [adaptive.mismatchMs, cards, locked, matched, open, tx],
  );

  return {
    ready: adaptive.ready && cards.length > 0,
    cards,
    open,
    matched,
    pairCount: adaptive.pairCount,
    nudge: nudge || tx("memoryHint"),
    bloomKey,
    onTap,
  };
}
