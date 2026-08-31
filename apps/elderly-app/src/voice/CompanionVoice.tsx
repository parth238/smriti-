import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";
import { useListening } from "./useListening";
import { checkBhashiniTts, speakAssameseViaBhashini } from "./bhashiniTts";
import { useSpeech } from "./useSpeech";

const voiceKey = "smriti.voice";

type CompanionVoiceValue = {
  voiceEnabled: boolean;
  setVoiceEnabled: (on: boolean) => void;
  isSpeaking: boolean;
  isListening: boolean;
  speechAvailable: boolean;
  listenAvailable: boolean;
  bhashiniAvailable: boolean;
  speakKey: (key: MessageKey) => void;
  speakText: (text: string) => void;
  listenOnce: () => Promise<string | null>;
};

const CompanionVoiceContext = createContext<CompanionVoiceValue | null>(null);

function readVoiceEnabled(): boolean {
  const stored = window.localStorage.getItem(voiceKey);
  return stored !== "off";
}

export function CompanionVoiceProvider({ children }: { children: ReactNode }) {
  const { language, tx } = useI18n();
  const [voiceEnabled, setVoiceEnabledState] = useState(readVoiceEnabled);
  const [bhashiniAvailable, setBhashiniAvailable] = useState(false);
  const { speak, cancel, isSpeaking, isAvailable: speechAvailable } = useSpeech(voiceEnabled);
  const { listen, isListening, isAvailable: listenAvailable } = useListening(voiceEnabled);

  useEffect(() => {
    void checkBhashiniTts().then(setBhashiniAvailable);
  }, []);

  const speakHybrid = useCallback(
    async (text: string) => {
      if (!voiceEnabled || !text.trim()) {
        return;
      }
      if (language === "as" && bhashiniAvailable) {
        const ok = await speakAssameseViaBhashini(text);
        if (ok) {
          return;
        }
      }
      await speak(text, { language });
    },
    [bhashiniAvailable, language, speak, voiceEnabled],
  );

  const setVoiceEnabled = useCallback(
    (on: boolean) => {
      window.localStorage.setItem(voiceKey, on ? "on" : "off");
      setVoiceEnabledState(on);
      if (!on) {
        cancel();
      }
    },
    [cancel],
  );

  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled) {
        return;
      }
      void speakHybrid(text);
    },
    [speakHybrid, voiceEnabled],
  );

  const speakKey = useCallback(
    (key: MessageKey) => {
      speakText(tx(key));
    },
    [speakText, tx],
  );

  const listenOnce = useCallback(async () => {
    if (!voiceEnabled) {
      return null;
    }
    const result = await listen(language);
    return result?.transcript ?? null;
  }, [language, listen, voiceEnabled]);

  const value = useMemo<CompanionVoiceValue>(
    () => ({
      voiceEnabled,
      setVoiceEnabled,
      isSpeaking,
      isListening,
      speechAvailable,
      listenAvailable,
      bhashiniAvailable,
      speakKey,
      speakText,
      listenOnce,
    }),
    [
      voiceEnabled,
      setVoiceEnabled,
      isSpeaking,
      isListening,
      speechAvailable,
      listenAvailable,
      bhashiniAvailable,
      speakKey,
      speakText,
      listenOnce,
    ],
  );

  return (
    <CompanionVoiceContext.Provider value={value}>{children}</CompanionVoiceContext.Provider>
  );
}

export function useCompanionVoice(): CompanionVoiceValue {
  const context = useContext(CompanionVoiceContext);
  if (!context) {
    throw new Error("CompanionVoiceProvider is missing");
  }
  return context;
}

/** Speaks a prompt once when the screen mounts (respects voice toggle). */
export function useSpeakOnMount(key: MessageKey, delayMs = 600) {
  const { voiceEnabled, speakKey } = useCompanionVoice();
  const spokeRef = useRef(false);

  useEffect(() => {
    spokeRef.current = false;
  }, [key]);

  useEffect(() => {
    if (!voiceEnabled) {
      return undefined;
    }
    if (spokeRef.current) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      spokeRef.current = true;
      speakKey(key);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, key, speakKey, voiceEnabled]);
}

/** Speaks when visible instruction/nudge text changes (pair found, gentle retry, etc.). */
export function useSpeakText(text: string, enabled = true, delayMs = 350) {
  const { voiceEnabled, speakText } = useCompanionVoice();
  const lastSpokenRef = useRef("");

  useEffect(() => {
    if (!voiceEnabled || !enabled || !text.trim()) {
      return undefined;
    }
    if (lastSpokenRef.current === text) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      lastSpokenRef.current = text;
      speakText(text);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, enabled, speakText, text, voiceEnabled]);
}
