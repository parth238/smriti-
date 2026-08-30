export type CulturalSceneId =
  | "bihu"
  | "tea"
  | "river"
  | "gamosa"
  | "kaziranga"
  | "hornbill";

export type CulturalItem = {
  id: string;
  scene: CulturalSceneId;
  titleKey:
    | "culturalBihu"
    | "culturalTea"
    | "culturalRiver"
    | "culturalGamosa"
    | "culturalKaziranga"
    | "culturalHornbill";
  promptKey:
    | "promptBihu"
    | "promptTea"
    | "promptRiver"
    | "promptGamosa"
    | "promptKaziranga"
    | "promptHornbill";
  state: string;
  source: string;
};

export const CULTURAL_PACK: CulturalItem[] = [
  {
    id: "bihu",
    scene: "bihu",
    titleKey: "culturalBihu",
    promptKey: "promptBihu",
    state: "Assam",
    source: "Rongali Bihu, Assam harvest festival",
  },
  {
    id: "tea",
    scene: "tea",
    titleKey: "culturalTea",
    promptKey: "promptTea",
    state: "Assam",
    source: "Assam tea gardens, Brahmaputra valley",
  },
  {
    id: "river",
    scene: "river",
    titleKey: "culturalRiver",
    promptKey: "promptRiver",
    state: "Assam",
    source: "Brahmaputra river as a living place name",
  },
  {
    id: "gamosa",
    scene: "gamosa",
    titleKey: "culturalGamosa",
    promptKey: "promptGamosa",
    state: "Assam",
    source: "Assamese gamosa, woven honour cloth",
  },
  {
    id: "kaziranga",
    scene: "kaziranga",
    titleKey: "culturalKaziranga",
    promptKey: "promptKaziranga",
    state: "Assam",
    source: "Kaziranga, public landmark of Assam",
  },
  {
    id: "hornbill",
    scene: "hornbill",
    titleKey: "culturalHornbill",
    promptKey: "promptHornbill",
    state: "Nagaland",
    source: "Hornbill Festival, Nagaland public cultural event named in product docs",
  },
];
