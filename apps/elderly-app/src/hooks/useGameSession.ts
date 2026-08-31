import { useCallback, useRef, useState } from "react";

import { readAccessToken } from "./useOfflineSync";
import { API_BASE } from "../api/auth";
import { GAME_IDS } from "../api/games";
import { db } from "../db/dexie";
import { enqueueSession, saveLocalSession } from "../db/syncOutbox";
import { rememberGame } from "../store/sessionPrefs";

export type GameSessionInput = {
  gameType: string;
  gamePath: string;
  difficulty: number;
  accuracy: number;
  reactionTimeMs: number;
  errors: number;
  hintsUsed?: number;
  sessionDurationSec: number;
  completedOrQuit?: "completed" | "quit";
};

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

    await saveLocalSession(session);
    window.sessionStorage.setItem(
      "smriti.lastSave",
      navigator.onLine ? "saved" : "queued",
    );

    const token = readAccessToken();
    if (navigator.onLine && token && userId !== "local-demo-user") {
      try {
        const gameId = GAME_IDS[input.gameType];
        const response = await fetch(`${API_BASE}/game-sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            game_id: gameId,
            game_type: input.gameType,
            difficulty: session.difficulty,
            accuracy: session.accuracy,
            reaction_time_ms: session.reactionTimeMs,
            errors: session.errors,
            hints_used: session.hintsUsed,
            session_duration_sec: session.sessionDurationSec,
            completed_or_quit: session.completedOrQuit,
            client_generated_id: session.clientGeneratedId,
            played_at: session.playedAt,
          }),
        });
        if (response.ok || response.status === 409) {
          await saveLocalSession({ ...session, synced: 1 });
          setSaveState("saved");
          window.sessionStorage.setItem("smriti.lastSave", "saved");
          return;
        }
      } catch {
        // fall through to outbox
      }
    }

    await enqueueSession(session);
    setSaveState("queued");
    window.sessionStorage.setItem("smriti.lastSave", "queued");
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
