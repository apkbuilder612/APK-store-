import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0B1120", card: "#121A2E", soft: "#1A2440" },
        brand: { green: "#22C55E", blue: "#2563EB" },
        line: "#223055",
        muted: "#8A93AE",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: { shimmer: "shimmer 1.5s infinite linear" },
    },
  },
  plugins: [],
};
export default config;
