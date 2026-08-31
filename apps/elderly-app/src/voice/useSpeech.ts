import { useCallback, useEffect, useRef, useState } from "react";

import type { Language } from "../i18n";

/** Web Speech language tags — Assamese often falls back to English in browsers. */
const VOICE_LANG: Record<Language, string[]> = {
  en: ["en-IN", "en-US", "en-GB"],
  as: ["as-IN", "bn-IN", "hi-IN", "en-IN"],
};

export type SpeakOptions = {
  language?: Language;
  rate?: number;
  pitch?: number;
};

function synthAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(langTags: string[]): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const tag of langTags) {
    const exact = voices.find((voice) => voice.lang.toLowerCase() === tag.toLowerCase());
    if (exact) {
      return exact;
    }
  }
  for (const tag of langTags) {
    const prefix = tag.split("-")[0]?.toLowerCase();
    const partial = voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix ?? ""));
    if (partial) {
      return partial;
    }
  }
  return voices[0] ?? null;
}

export function useSpeech(enabled: boolean) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable] = useState(() => synthAvailable());
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!isAvailable) {
      return undefined;
    }
    const prime = () => {
      window.speechSynthesis.getVoices();
    };
    prime();
    window.speechSynthesis.addEventListener("voiceschanged", prime);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", prime);
      window.speechSynthesis.cancel();
      utterRef.current = null;
      setIsSpeaking(false);
    };
  }, [isAvailable]);

  const cancel = useCallback(() => {
    if (!isAvailable) {
      return;
    }
    window.speechSynthesis.cancel();
    utterRef.current = null;
    setIsSpeaking(false);
  }, [isAvailable]);

  useEffect(() => {
    if (!enabled) {
      cancel();
    }
  }, [cancel, enabled]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!enabledRef.current || !isAvailable || !text.trim()) {
        return Promise.resolve(false);
      }

      cancel();

      return new Promise<boolean>((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        const lang = options.language ?? "en";
        const tags = VOICE_LANG[lang];
        const voice = pickVoice(tags);
        utter.lang = voice?.lang ?? tags[0] ?? "en-IN";
        if (voice) {
          utter.voice = voice;
        }
        utter.rate = options.rate ?? 0.92;
        utter.pitch = options.pitch ?? 1.05;

        const finish = (ok: boolean) => {
          setIsSpeaking(false);
          utterRef.current = null;
          resolve(ok);
        };

        utter.onstart = () => {
          if (enabledRef.current) {
            setIsSpeaking(true);
          }
        };
        utter.onend = () => finish(true);
        utter.onerror = () => finish(false);

        utterRef.current = utter;
        window.speechSynthesis.speak(utter);
      });
    },
    [cancel, isAvailable],
  );

  return { speak, cancel, isSpeaking, isAvailable };
}

/** Documented fallback note for Assamese TTS in integrations doc. */
export const ASSAMESE_TTS_NOTE =
  "Web Speech may not ship an Assamese voice; we try as-IN then bn-IN/hi-IN, then en-IN.";
