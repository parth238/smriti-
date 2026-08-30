export const TEA_STEPS = ["stepBoil", "stepLeaves", "stepPour", "stepSip"] as const;

export type TeaStepId = (typeof TEA_STEPS)[number];
