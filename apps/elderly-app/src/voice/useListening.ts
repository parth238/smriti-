import { useCallback, useEffect, useRef, useState } from "react";

import type { Language } from "../i18n";

type SpeechRecognitionCtor = new () => SpeechRecognition;

/** Web Speech has no Assamese ASR — both UI languages use English India STT for MVP. */
const LISTEN_LANG: Record<Language, string> = {
  en: "en-IN",
  as: "en-IN",
};

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type ListenResult = {
  transcript: string;
  confidence: number;
};

export function useListening(enabled: boolean) {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable] = useState(() => recognitionCtor() !== null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  const listen = useCallback(
    (language: Language = "en", timeoutMs = 8000): Promise<ListenResult | null> => {
      if (!enabledRef.current || !isAvailable) {
        return Promise.resolve(null);
      }

      const Ctor = recognitionCtor();
      if (!Ctor) {
        return Promise.resolve(null);
      }

      return new Promise((resolve) => {
        const recognition = new Ctor();
        recognitionRef.current = recognition;
        recognition.lang = LISTEN_LANG[language];
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let settled = false;
        const finish = (value: ListenResult | null) => {
          if (settled) {
            return;
          }
          settled = true;
          window.clearTimeout(timer);
          setIsListening(false);
          recognitionRef.current = null;
          resolve(value);
        };

        const timer = window.setTimeout(() => {
          recognition.stop();
          finish(null);
        }, timeoutMs);

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
          const result = event.results[0];
          if (!result) {
            finish(null);
            return;
          }
          finish({
            transcript: result[0]?.transcript?.trim() ?? "",
            confidence: result[0]?.confidence ?? 0,
          });
        };
        recognition.onerror = () => finish(null);
        recognition.onend = () => {
          if (!settled) {
            finish(null);
          }
        };

        try {
          recognition.start();
        } catch {
          finish(null);
        }
      });
    },
    [isAvailable],
  );

  return { listen, stop, isListening, isAvailable };
}
