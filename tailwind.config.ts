import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand accent — teal blue
        brand: {
          50: "#E8F5F9",
          100: "#C9E9F1",
          200: "#9BD5E4",
          500: "#2AA0C4",
          600: "#218DAE",
          700: "#1B7089",
          900: "#0F3F4C",
        },
        // Deep navy — used for dark-mode background and headings
        ink: {
          DEFAULT: "#091540",
          50: "#EEF0F8",
          100: "#D7DCEE",
          700: "#141F52",
          900: "#091540",
        },
        // Purple accent — used for PWA badges, secondary highlights
        grape: {
          DEFAULT: "#722F99",
          50: "#F3E9F9",
          100: "#E2C7F0",
          600: "#722F99",
          700: "#5C2680",
        },
        // Wine accent — used for hover states, tertiary highlights
        wine: {
          DEFAULT: "#601D49",
          50: "#F3E6EE",
          600: "#601D49",
          700: "#4A1739",
        },
        // Soft background tint
        cream: "#FFF2F2",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite linear",
      },
    },
  },
  plugins: [],
};

export default config;
