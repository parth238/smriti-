import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  readLanguage,
  t,
  writeLanguage,
  type Language,
  type MessageKey,
} from "../i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  textSize: "comfortable" | "large";
  setTextSize: (size: "comfortable" | "large") => void;
  tx: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const sizeKey = "smriti.textSize";

function readTextSize(): "comfortable" | "large" {
  return window.localStorage.getItem(sizeKey) === "large" ? "large" : "comfortable";
}

function applyTextSize(size: "comfortable" | "large") {
  document.documentElement.dataset.size = size;
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language === "as" ? "as" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const next = readLanguage();
    applyLanguage(next);
    return next;
  });
  const [textSize, setTextSizeState] = useState<"comfortable" | "large">(() => {
    const size = readTextSize();
    applyTextSize(size);
    return size;
  });

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => {
        writeLanguage(next);
        applyLanguage(next);
        setLanguageState(next);
      },
      textSize,
      setTextSize: (size) => {
        window.localStorage.setItem(sizeKey, size);
        applyTextSize(size);
        setTextSizeState(size);
      },
      tx: (key) => t(language, key),
    }),
    [language, textSize],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("LanguageProvider is missing");
  }
  return context;
}
