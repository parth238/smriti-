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
        "deep-hill": "#1E2A2F",
        "gamosa-red": "#A8342A",
        "tea-garden": "#4B6E58",
        "mist-blue": "#7C93A3",
        marigold: "#E0A542",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
