export const GAME_ASSETS = {
  hillLandscape: "/assets/games/hill_landscape_bg.png",
  grandmother: "/assets/games/character_grandmother.png",
  grandfather: "/assets/games/character_grandfather.png",
  bihuFestival: "/assets/games/reminiscence_bihu_festival.png",
  memorySheet: "/assets/games/memory_match_icon_sheet.png",
  attentionSheet: "/assets/games/attention_tap_targets.png",
  sequencingSheet: "/assets/games/sequencing_daily_routine.png",
  namingSheet: "/assets/games/naming_game_objects.png",
} as const;

export const MEMORY_ICONS = ["pot", "calendar", "tree", "elephant", "hills", "bowl"] as const;
export type MemoryIconId = (typeof MEMORY_ICONS)[number];

export const ATTENTION_ICONS = ["target", "star", "bell", "leaf", "butterfly"] as const;
export type AttentionIconId = (typeof ATTENTION_ICONS)[number];

export const DAILY_STEPS = ["stepWake", "stepMedicine", "stepMeal", "stepCall", "stepBed"] as const;
export type DailyStepId = (typeof DAILY_STEPS)[number];

export const NAMING_ICONS = ["mug", "flower", "cow", "umbrella", "fish", "book"] as const;
export type NamingIconId = (typeof NAMING_ICONS)[number];

export function spriteIndex<T extends readonly string[]>(items: T, id: T[number]): number {
  return items.indexOf(id);
}
