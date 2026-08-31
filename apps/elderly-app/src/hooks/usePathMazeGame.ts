import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { generateMazePath, isOnPath, type MazeCell } from "../games/PathMaze/logic";
import { mazeGridSize } from "../lib/adaptive";
import { useI18n } from "../context/LanguageContext";
import { useAdaptiveDifficulty } from "./useAdaptiveDifficulty";
import { useGameSession } from "./useGameSession";

export function usePathMazeGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const adaptive = useAdaptiveDifficulty("path_maze");
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const size = mazeGridSize(adaptive.difficulty);
  const path = useMemo(() => generateMazePath(size), [size]);
  const [progress, setProgress] = useState(0);
  const [nudge, setNudge] = useState("");
  const errors = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    markStarted("/games/path-maze");
  }, [markStarted]);

  useEffect(() => {
    if (!adaptive.ready) return;
    setProgress(0);
    setNudge("");
    errors.current = 0;
    finished.current = false;
  }, [adaptive.ready, size]);

  const tap = useCallback(
    (row: number, col: number) => {
      if (finished.current) return;
      const expected = path[progress + 1];
      if (!expected || expected.row !== row || expected.col !== col) {
        setNudge(tx("pathWrongTurn"));
        errors.current += 1;
        return;
      }
      const next = progress + 1;
      setProgress(next);
      setNudge(next + 1 >= path.length ? tx("pathComplete") : tx("pathHint"));
      if (next + 1 >= path.length) {
        finished.current = true;
        window.setTimeout(() => {
          void recordResult({
            gameType: "path_maze",
            gamePath: "/games/path-maze",
            difficulty: adaptive.difficulty,
            accuracy: Math.max(60, 100 - errors.current * 10),
            reactionTimeMs: Math.round((elapsedSec() * 1000) / path.length),
            errors: errors.current,
            sessionDurationSec: elapsedSec(),
          }).then(() => navigate("/games/path-maze/result", { replace: true }));
        }, 800);
      }
    },
    [adaptive.difficulty, elapsedSec, navigate, path, progress, recordResult, tx],
  );

  const visited = path.slice(0, progress + 1);
  const pathKeys = new Set(visited.map((c) => `${c.row}-${c.col}`));
  const hintCell = path[progress + 1];

  return {
    ready: adaptive.ready,
    size,
    pathKeys,
    hintCell,
    goal: path[path.length - 1] as MazeCell,
    nudge: nudge || tx("pathMazeHint"),
    tap,
    isOnPath: (row: number, col: number) => isOnPath(path, { row, col }),
  };
}
