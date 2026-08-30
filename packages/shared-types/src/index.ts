export const GAME_TYPES = [
  "memory_match",
  "attention_reaction",
  "sequencing",
  "picture_naming",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export type LanguageCode = "en" | "as";

export type LocalizedText = {
  en: string;
  as: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

export type CaregiverRegisterRequest = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

export type CaregiverLoginRequest = {
  phone_or_email: string;
  password: string;
};

export type ElderlyCreateRequest = {
  full_name: string;
  phone?: string;
  preferred_language: LanguageCode;
  pin: string;
};

export type ElderlyLoginRequest = {
  phone?: string;
  user_id?: string;
  pin: string;
};

export type GameSessionPayload = {
  user_id: string;
  game_id: string;
  difficulty: number;
  accuracy: number;
  reaction_time_ms: number;
  errors: number;
  hints_used: number;
  session_duration_sec: number;
  completed_or_quit: "completed" | "quit";
  client_generated_id: string;
  played_at: string;
};
