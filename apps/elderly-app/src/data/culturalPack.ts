import assamesePack from "../../../../packages/content-packs/assamese/cultural-media.json";
import englishPack from "../../../../packages/content-packs/english/cultural-media.json";
import manipuriPack from "../../../../packages/content-packs/manipuri/cultural-media.json";

export type CulturalSceneId =
  | "bihu"
  | "tea"
  | "river"
  | "gamosa"
  | "kaziranga"
  | "hornbill";

type PackItem = {
  id: string;
  scene: CulturalSceneId;
  titleKey: string;
  promptKey: string;
  state: string;
  source: string;
};

type PackFile = {
  region: string;
  language: string;
  source: string;
  items: PackItem[];
};

export type CulturalItem = {
  id: string;
  scene: CulturalSceneId;
  titleKey:
    | "culturalBihu"
    | "culturalTea"
    | "culturalRiver"
    | "culturalGamosa"
    | "culturalKaziranga"
    | "culturalHornbill"
    | "culturalYaoshang"
    | "culturalLoktak"
    | "culturalSangai";
  promptKey:
    | "promptBihu"
    | "promptTea"
    | "promptRiver"
    | "promptGamosa"
    | "promptKaziranga"
    | "promptHornbill"
    | "promptYaoshang"
    | "promptLoktak"
    | "promptSangai";
  state: string;
  source: string;
};

const PACKS: Record<string, PackFile> = {
  as: assamesePack as PackFile,
  en: englishPack as PackFile,
  mni: manipuriPack as PackFile,
};

function normalizeItem(item: PackItem): CulturalItem {
  return {
    id: item.id,
    scene: item.scene,
    titleKey: item.titleKey as CulturalItem["titleKey"],
    promptKey: item.promptKey as CulturalItem["promptKey"],
    state: item.state,
    source: item.source,
  };
}

export function loadBundledCulturalPack(language: string): CulturalItem[] {
  const pack = PACKS[language] ?? PACKS.as;
  return pack.items.map(normalizeItem);
}

/** Primary Assam + NER pack bundled for offline reminiscence and games. */
export const CULTURAL_PACK: CulturalItem[] = loadBundledCulturalPack("as");
