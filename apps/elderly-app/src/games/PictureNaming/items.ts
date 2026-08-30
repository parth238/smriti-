import type { MotifId } from "../memory";

export type NameKey = "nameTea" | "nameRiver" | "nameBird" | "nameCloth";

export type NamingItem = {
  show: MotifId | "flower" | "river";
  yes: NameKey;
  no: NameKey;
};

export const NAMING_ITEMS: NamingItem[] = [
  { show: "tea", yes: "nameTea", no: "nameRiver" },
  { show: "river", yes: "nameRiver", no: "nameCloth" },
  { show: "bird", yes: "nameBird", no: "nameTea" },
  { show: "cloth", yes: "nameCloth", no: "nameBird" },
];
