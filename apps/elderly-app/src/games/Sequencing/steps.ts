export { DAILY_STEPS, type DailyStepId } from "../../data/gameAssets";

/** @deprecated use DAILY_STEPS */
export const TEA_STEPS = ["stepWake", "stepMedicine", "stepMeal", "stepCall", "stepBed"] as const;

export type TeaStepId = (typeof TEA_STEPS)[number];
