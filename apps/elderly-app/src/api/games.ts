/** Stable game UUIDs — keep in sync with backend game_catalog.py */
export const GAME_IDS: Record<string, string> = {
  memory_match: "11111111-1111-4111-8111-111111111101",
  attention_reaction: "11111111-1111-4111-8111-111111111102",
  sequencing: "11111111-1111-4111-8111-111111111103",
  picture_naming: "11111111-1111-4111-8111-111111111104",
  simple_arithmetic: "11111111-1111-4111-8111-111111111105",
  path_maze: "11111111-1111-4111-8111-111111111106",
  face_recall: "11111111-1111-4111-8111-111111111107",
};

export function gameTypeFromPath(path: string): string {
  if (path.includes("memory-match")) return "memory_match";
  if (path.includes("attention-reaction")) return "attention_reaction";
  if (path.includes("sequencing")) return "sequencing";
  if (path.includes("picture-naming")) return "picture_naming";
  if (path.includes("arithmetic")) return "simple_arithmetic";
  if (path.includes("path-maze")) return "path_maze";
  if (path.includes("face-recall")) return "face_recall";
  return "memory_match";
}
