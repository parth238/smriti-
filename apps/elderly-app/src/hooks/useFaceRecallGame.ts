import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadFamilyMemories, resolveMediaUrl, type ApiMemoryItem } from "../api/memories";
import { useI18n } from "../context/LanguageContext";
import { faceRecallRoundCount } from "../lib/adaptive";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

type FaceRound = { id: string; url: string; name: string; choices: string[] };

function pickName(item: ApiMemoryItem, lang: "en" | "as"): string {
  return item.people_tagged?.[0] ?? item.title[lang] ?? item.title.en ?? txFallback();
}

function txFallback(): string {
  return "Family";
}

function buildRounds(items: ApiMemoryItem[], count: number, lang: "en" | "as"): FaceRound[] {
  const pool = items.length >= 2 ? items : [];
  return pool.slice(0, count).map((item) => {
    const name = pickName(item, lang);
    const others = pool.filter((r) => r.id !== item.id).map((r) => pickName(r, lang)).filter((n) => n !== name);
    const choices = [name, others[0] ?? "Friend", others[1] ?? "Neighbour"].sort(() => Math.random() - 0.5);
    return { id: item.id, url: resolveMediaUrl(item.media_url), name, choices };
  });
}

export function useFaceRecallGame() {
  const { tx, language } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("face_recall");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [rounds, setRounds] = useState<FaceRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState("");
  const errors = useRef(0);
  const current = rounds[index];

  useEffect(() => {
    markStarted("/games/face-recall");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) return;
    void loadFamilyMemories().then((family) => {
      setRounds(buildRounds(family, faceRecallRoundCount(adaptive.difficulty), language));
      setIndex(0);
      setNudge("");
      errors.current = 0;
      setLoading(false);
    });
  }, [adaptive.difficulty, adaptive.ready, language]);

  const choose = useCallback(
    (name: string) => {
      if (!current || name !== current.name) {
        setNudge(tx("tryAgainGentle"));
        errors.current += 1;
        return;
      }
      if (index + 1 >= rounds.length) {
        void recordResult({
          gameType: "face_recall",
          gamePath: "/games/face-recall",
          difficulty: adaptive.difficulty,
          accuracy: Math.max(0, Math.min(100, Math.round((rounds.length / (rounds.length + errors.current)) * 100))),
          reactionTimeMs: Math.round((elapsedSec() * 1000) / Math.max(1, rounds.length)),
          errors: errors.current,
          sessionDurationSec: elapsedSec(),
        }).then(() => navigate("/games/face-recall/result", { replace: true }));
        return;
      }
      setNudge("");
      setIndex((v) => v + 1);
    },
    [adaptive.difficulty, current, elapsedSec, index, navigate, recordResult, rounds.length, tx],
  );

  return {
    ready: adaptive.ready && !loading && rounds.length > 0,
    empty: !loading && rounds.length === 0,
    current,
    index,
    total: rounds.length,
    nudge: nudge || tx("faceRecallHint"),
    choose,
  };
}
