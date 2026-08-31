import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";
import { useListening } from "./useListening";
import { useSpeech } from "./useSpeech";

const voiceKey = "smriti.voice";

type CompanionVoiceValue = {
  voiceEnabled: boolean;
  setVoiceEnabled: (on: boolean) => void;
  isSpeaking: boolean;
  isListening: boolean;
  speechAvailable: boolean;
  listenAvailable: boolean;
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
  const { speak, isSpeaking, isAvailable: speechAvailable } = useSpeech(voiceEnabled);
  const { listen, isListening, isAvailable: listenAvailable } = useListening(voiceEnabled);

  const setVoiceEnabled = useCallback((on: boolean) => {
    window.localStorage.setItem(voiceKey, on ? "on" : "off");
    setVoiceEnabledState(on);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      void speak(text, { language });
    },
    [language, speak],
  );

  const speakKey = useCallback(
    (key: MessageKey) => {
      speakText(tx(key));
    },
    [speakText, tx],
  );

  const listenOnce = useCallback(async () => {
    const result = await listen(language);
    return result?.transcript ?? null;
  }, [language, listen]);

  const value = useMemo<CompanionVoiceValue>(
    () => ({
      voiceEnabled,
      setVoiceEnabled,
      isSpeaking,
      isListening,
      speechAvailable,
      listenAvailable,
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

  useEffect(() => {
    if (!voiceEnabled) {
      return undefined;
    }
    const timer = window.setTimeout(() => speakKey(key), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, key, speakKey, voiceEnabled]);
}
