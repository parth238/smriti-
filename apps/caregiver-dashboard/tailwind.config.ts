import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDF6E9",
        charcoal: "#1F2937",
        terracotta: "#B5342A",
        olive: "#4A6B4E",
        "rice-white": "#FBF9F4",
        "deep-hill": "#19382C",
        "gamosa-red": "#A8342A",
        "tea-garden": "#4A7C59",
        "mist-blue": "#727973",
        marigold: "#C5A059",
        sand: "#F0EEE9",
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "Noto Sans", "sans-serif"],
        display: ["Newsreader", "Georgia", "serif"],
        serif: ["Newsreader", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
