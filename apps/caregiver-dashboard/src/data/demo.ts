export type SessionRow = {
  id: string;
  game: string;
  playedAt: string;
  accuracy: number;
  reactionMs: number;
  completed: boolean;
};

export type TrendPoint = {
  day: string;
  accuracy: number;
  reactionMs: number;
};

export type ReminderRow = {
  id: string;
  title: string;
  time: string;
  missed: boolean;
  type?: string;
  scheduledTime?: string;
  active?: boolean;
};

export type MemoryRow = {
  id: string;
  title: string;
  region: string;
  kind: "cultural" | "family";
  mediaUrl?: string;
};

export const PATIENT = {
  label: "Family member",
  language: "Assamese",
  region: "Assam",
  baselineAccuracy: 72,
  baselineReactionMs: 980,
};

export const SESSIONS: SessionRow[] = [
  {
    id: "s1",
    game: "Memory Match",
    playedAt: "Sun 30 Aug, morning",
    accuracy: 75,
    reactionMs: 940,
    completed: true,
  },
  {
    id: "s2",
    game: "Attention",
    playedAt: "Sun 30 Aug, afternoon",
    accuracy: 80,
    reactionMs: 1010,
    completed: true,
  },
  {
    id: "s3",
    game: "Sequencing",
    playedAt: "Sat 29 Aug, evening",
    accuracy: 70,
    reactionMs: 1120,
    completed: true,
  },
  {
    id: "s4",
    game: "Picture Naming",
    playedAt: "Fri 28 Aug, morning",
    accuracy: 68,
    reactionMs: 1080,
    completed: false,
  },
];

export const TRENDS: TrendPoint[] = [
  { day: "Mon", accuracy: 70, reactionMs: 1040 },
  { day: "Tue", accuracy: 72, reactionMs: 1010 },
  { day: "Wed", accuracy: 69, reactionMs: 1100 },
  { day: "Thu", accuracy: 74, reactionMs: 990 },
  { day: "Fri", accuracy: 68, reactionMs: 1080 },
  { day: "Sat", accuracy: 70, reactionMs: 1120 },
  { day: "Sun", accuracy: 78, reactionMs: 975 },
];

export const REMINDERS: ReminderRow[] = [
  { id: "r1", title: "Evening medicine", time: "8:00 in the evening", missed: true },
  { id: "r2", title: "A glass of water", time: "When they are ready", missed: false },
];

export const MEMORIES: MemoryRow[] = [
  { id: "m1", title: "Bihu", region: "Assam", kind: "cultural" },
  { id: "m2", title: "Tea garden", region: "Assam", kind: "cultural" },
  { id: "m3", title: "The big river", region: "Assam", kind: "cultural" },
  { id: "m4", title: "Hornbill", region: "Nagaland", kind: "cultural" },
];
