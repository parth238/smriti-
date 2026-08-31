import type { MessageKey } from "../i18n";
import type { MotifId } from "../games/memory";

/** Links game motifs to reminiscence prompts from the cultural pack. */
export const MOTIF_MEMORY_PROMPTS: Record<MotifId, MessageKey> = {
  tea: "promptTea",
  river: "promptRiver",
  bird: "promptHornbill",
  cloth: "promptGamosa",
  lamp: "promptBihu",
};
