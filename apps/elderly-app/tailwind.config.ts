import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "rice-white": "#FBF9F4",
        "deep-hill": "#1E2A2F",
        "gamosa-red": "#A8342A",
        "tea-garden": "#4B6E58",
        "mist-blue": "#7C93A3",
        marigold: "#E0A542",
      },
      fontFamily: {
        display: ["Poppins", "Baloo 2", "sans-serif"],
        body: ["Noto Sans", "Noto Sans Bengali", "sans-serif"],
      },
      fontSize: {
        display: ["40px", { lineHeight: "1.2", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.25", fontWeight: "600" }],
        h2: ["26px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["22px", { lineHeight: "1.5", fontWeight: "400" }],
        body: ["18px", { lineHeight: "1.5", fontWeight: "400" }],
        "button-label": ["24px", { lineHeight: "1.2", fontWeight: "600" }],
      },
      minHeight: {
        tap: "56px",
      },
      spacing: {
        tap: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
