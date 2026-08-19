import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#1a5c34",
          light: "#237a45",
          dark: "#0f3d22",
          line: "#ffffff40",
        },
        squad: {
          bg: "#0b1220",
          panel: "#121b2e",
          border: "#233047",
          accent: "#22c55e",
          bid: "#f59e0b",
        },
      },
      backgroundImage: {
        "pitch-stripes":
          "repeating-linear-gradient(90deg, #1a5c34 0px, #1a5c34 40px, #1e6a3c 40px, #1e6a3c 80px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
      },
      animation: {
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "count-down": "count-down linear forwards",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.6) translateY(24px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "count-down": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "var(--circumference)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
