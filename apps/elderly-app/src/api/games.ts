/** Map route paths to stable game_type API values (not database UUIDs). */
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
