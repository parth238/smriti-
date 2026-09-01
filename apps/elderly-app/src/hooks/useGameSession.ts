import { useCallback, useRef, useState } from "react";

import { readAccessToken } from "./useOfflineSync";
import { persistCompletedGameSession } from "../db/syncOutbox";
import { notifyAdaptiveRefresh } from "../lib/adaptiveEvents";
import { markActiveGameCompleted } from "../lib/gameSessionRegistry";
import { rememberGame } from "../store/sessionPrefs";
import type { GameSessionInput } from "../types/gameSession";

export type { GameSessionInput } from "../types/gameSession";

export type SaveState = "idle" | "saving" | "saved" | "queued";

function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readUserId(): Promise<string> {
  const fromSession = window.sessionStorage.getItem("smriti.userId");
  if (fromSession) {
    return fromSession;
  }
  const { db } = await import("../db/dexie");
  const paired = await db.paired.toCollection().first();
  return paired?.id ?? "local-demo-user";
}

export function useGameSession() {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const startedAt = useRef(Date.now());

  const markStarted = useCallback((gamePath: string) => {
    startedAt.current = Date.now();
    rememberGame(gamePath);
  }, []);

  const elapsedSec = useCallback(() => {
    return Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
  }, []);

  const recordResult = useCallback(async (input: GameSessionInput) => {
    setSaveState("saving");
    const clientGeneratedId = newClientId();
    const userId = await readUserId();
    const session = {
      clientGeneratedId,
      userId,
      gameType: input.gameType,
      difficulty: input.difficulty,
      accuracy: input.accuracy,
      reactionTimeMs: input.reactionTimeMs,
      errors: input.errors,
      hintsUsed: input.hintsUsed ?? 0,
      sessionDurationSec: input.sessionDurationSec || elapsedSec(),
      completedOrQuit: input.completedOrQuit ?? "completed",
      playedAt: new Date().toISOString(),
      synced: 0,
    };

    const token = readAccessToken();
    const outcome = await persistCompletedGameSession(session, token);
    notifyAdaptiveRefresh(input.gameType);
    markActiveGameCompleted();
    window.sessionStorage.setItem("smriti.lastDifficulty", String(session.difficulty));
    window.sessionStorage.setItem("smriti.lastGameType", session.gameType);
    window.sessionStorage.setItem("smriti.lastAccuracy", String(session.accuracy));
    window.sessionStorage.setItem("smriti.lastSave", outcome);
    setSaveState(outcome === "saved" ? "saved" : "queued");
  }, [elapsedSec]);

  return { markStarted, recordResult, saveState, elapsedSec };
}

export function lastSaveNote(): "saved" | "queued" | null {
  const value = window.sessionStorage.getItem("smriti.lastSave");
  if (value === "saved" || value === "queued") {
    return value;
  }
  return null;
}
