import type { NamingIconId } from "../../data/gameAssets";

export type NameKey =
  | "nameMug"
  | "nameFlower"
  | "nameCow"
  | "nameUmbrella"
  | "nameFish"
  | "nameBook";

export type NamingItem = {
  show: NamingIconId;
  yes: NameKey;
  no: NameKey;
};

export const NAMING_ITEMS: NamingItem[] = [
  { show: "mug", yes: "nameMug", no: "nameBook" },
  { show: "flower", yes: "nameFlower", no: "nameFish" },
  { show: "cow", yes: "nameCow", no: "nameUmbrella" },
  { show: "umbrella", yes: "nameUmbrella", no: "nameMug" },
  { show: "fish", yes: "nameFish", no: "nameCow" },
  { show: "book", yes: "nameBook", no: "nameFlower" },
];
