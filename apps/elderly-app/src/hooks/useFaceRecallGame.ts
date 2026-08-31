import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loadFamilyMemories, resolveMediaUrl, type ApiMemoryItem } from "../api/memories";
import { GAME_ASSETS } from "../data/gameAssets";
import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";
import { faceRecallRoundCount } from "../lib/adaptive";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

type FaceRound = { id: string; url: string; name: string; choices: string[] };

function pickName(item: ApiMemoryItem, lang: "en" | "as"): string {
  return item.people_tagged?.[0] ?? item.title[lang] ?? item.title.en ?? "Family";
}

function buildRounds(
  items: ApiMemoryItem[],
  count: number,
  lang: "en" | "as",
  distractors: [string, string, string],
): FaceRound[] {
  if (items.length < 2) {
    return [];
  }
  return items.slice(0, count).map((item) => {
    const name = pickName(item, lang);
    const others = items
      .filter((row) => row.id !== item.id)
      .map((row) => pickName(row, lang))
      .filter((label) => label !== name);
    const choices = [name, others[0] ?? distractors[0], others[1] ?? distractors[1]].sort(
      () => Math.random() - 0.5,
    );
    return { id: item.id, url: resolveMediaUrl(item.media_url), name, choices };
  });
}

function buildDemoRounds(
  count: number,
  tx: (key: MessageKey) => string,
): FaceRound[] {
  const name = tx("faceDemoName");
  const alts: [string, string, string] = [tx("faceDemoAlt1"), tx("faceDemoAlt2"), tx("faceDemoAlt3")];
  return Array.from({ length: Math.min(count, 3) }, (_, index) => ({
    id: `demo-${index}`,
    url: GAME_ASSETS.grandmother,
    name,
    choices: [name, alts[index % 3], alts[(index + 1) % 3]].sort(() => Math.random() - 0.5),
  }));
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
  const [demoMode, setDemoMode] = useState(false);
  const errors = useRef(0);
  const current = rounds[index];

  useEffect(() => {
    markStarted("/games/face-recall");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) {
      return;
    }
    setLoading(true);
    const distractors: [string, string, string] = [
      tx("faceDemoAlt1"),
      tx("faceDemoAlt2"),
      tx("faceDemoAlt3"),
    ];
    void loadFamilyMemories().then((family) => {
      const built = buildRounds(family, faceRecallRoundCount(adaptive.difficulty), language, distractors);
      if (built.length > 0) {
        setRounds(built);
        setDemoMode(false);
      } else {
        setRounds(buildDemoRounds(faceRecallRoundCount(adaptive.difficulty), tx));
        setDemoMode(true);
      }
      setIndex(0);
      setNudge("");
      errors.current = 0;
      setLoading(false);
    });
  }, [adaptive.difficulty, adaptive.ready, language, tx]);

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
      setIndex((value) => value + 1);
    },
    [adaptive.difficulty, current, elapsedSec, index, navigate, recordResult, rounds.length, tx],
  );

  return {
    ready: adaptive.ready && !loading && rounds.length > 0,
    empty: false,
    demoMode,
    current,
    index,
    total: rounds.length,
    nudge: nudge || tx("faceRecallHint"),
    choose,
  };
}
