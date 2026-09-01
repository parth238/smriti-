export const ELDERLY_URL = import.meta.env.VITE_ELDERLY_APP_URL ?? "http://localhost:5173";

export const HERO_IMAGE = "/story/story-01-anima.png";

export type NavSection = "hook" | "problem" | "solution";

export const NAV_SECTIONS: { id: NavSection; label: string; href: string }[] = [
  { id: "hook", label: "Why", href: "#hook" },
  { id: "problem", label: "Problem", href: "#problem" },
  { id: "solution", label: "Solution", href: "#solution" },
];

export const HOOK_COPY = {
  headline: "Memory fades quietly. Distance does not wait.",
  body: "Every evening, millions of families ask the same question over the phone — are you alright? — and hope the answer is honest. Smriti exists for the days when it is not enough to hope.",
};

/** India dementia prevalence — millions (interpolated between published anchors). */
export const DEMENTIA_CHART_DATA = [
  { year: "2010", millions: 3.7 },
  { year: "2015", millions: 5.1 },
  { year: "2020", millions: 6.8 },
  { year: "2024", millions: 8.8 },
  { year: "2028", millions: 11.4 },
  { year: "2032", millions: 14.2 },
  { year: "2036", millions: 16.9 },
] as const;

export const DEMENTIA_STATS = [
  {
    value: "8.8M",
    label: "Living with dementia in India today",
    detail: "Nearly one in ten elders over 60",
  },
  {
    value: "16.9M",
    label: "Projected by 2036",
    detail: "Almost double in twelve years",
  },
  {
    value: "+92%",
    label: "Expected growth",
    detail: "2024 → 2036 trajectory",
  },
  {
    value: "70%+",
    label: "Families care at home",
    detail: "Most without daily specialist support",
  },
] as const;

export type ProblemBeat = {
  id: string;
  image: string;
  objectPosition: string;
  title: string;
  copy: string;
};

export const PROBLEM_BEATS: ProblemBeat[] = [
  {
    id: "01",
    image: "/story/story-01-anima.png",
    objectPosition: "center 20%",
    title: "She forgets small things first",
    copy: "Anima-aita forgets what she came into the room for. Some days she forgets her son's face for a moment — then it comes back, and so does the fear that next time it won't.",
  },
  {
    id: "02",
    image: "/story/story-02-bikash.png",
    objectPosition: "center 30%",
    title: "You are not in the same room",
    copy: "Her son Bikash lives four hours away in Guwahati. He calls every evening. He cannot always tell, over the phone, if she ate, slept, or took her medicine.",
  },
  {
    id: "03",
    image: "/story/story-03-medicine.png",
    objectPosition: "center 40%",
    title: "Today slips away",
    copy: "Medicines get missed. Not from carelessness — from a mind that is quietly losing its grip on what day it is and what already happened this morning.",
  },
  {
    id: "04",
    image: "/story/story-04-smriti.png",
    objectPosition: "center 25%",
    title: "She deserves something in her own language",
    copy: "Apps built elsewhere speak English. Her memories, her jokes, her prayers — they live in Assamese. Care should sound like home, not like a hospital form.",
  },
  {
    id: "05",
    image: "/story/story-05-reunion.png",
    objectPosition: "center 35%",
    title: "Peace should not require constant worry",
    copy: "Families should not have to choose between living their own lives and watching every hour for a sign that something went wrong.",
  },
];

export const SOLUTION_POINTS = [
  {
    title: "A calm companion on her phone",
    body: "Games that keep her mind engaged, reminders she can hear in Assamese, and family photos that help her remember who loves her.",
  },
  {
    title: "A desk for you — without hovering",
    body: "See whether she played today, whether medicine was acknowledged, and whether this week feels like her usual — from wherever you are.",
  },
  {
    title: "Works when life is offline",
    body: "When the network drops, her routine does not. Everything catches up quietly when connection returns.",
  },
] as const;
