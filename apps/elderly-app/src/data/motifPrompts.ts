import type { MessageKey } from "../i18n";
import type { MotifId } from "../games/memory";

/** Links memory-match icons to reminiscence prompts. */
export const MOTIF_MEMORY_PROMPTS: Record<MotifId, MessageKey> = {
  pot: "promptTea",
  calendar: "promptBihu",
  tree: "promptTea",
  elephant: "promptKaziranga",
  hills: "promptTea",
  bowl: "promptGamosa",
};
