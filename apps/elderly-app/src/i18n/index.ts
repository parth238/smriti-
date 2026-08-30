import asJson from "./as.json";
import enJson from "./en.json";

export type Language = "en" | "as";
export type MessageKey = keyof typeof enJson;

const catalogs: Record<Language, Record<MessageKey, string>> = {
  en: enJson,
  as: asJson,
};

const storageKey = "smriti.language";

export function readLanguage(): Language {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "en" || stored === "as") {
    return stored;
  }
  const fallback = import.meta.env.VITE_DEFAULT_LANGUAGE;
  return fallback === "en" ? "en" : "as";
}

export function writeLanguage(language: Language): void {
  window.localStorage.setItem(storageKey, language);
}

export function t(language: Language, key: MessageKey): string {
  return catalogs[language][key];
}
