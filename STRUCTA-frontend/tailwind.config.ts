import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          200: "#C4B5FD",
          300: "#A78BFA",
          400: "#8B5CF6",
          500: "#7C3AED",
          600: "#5B21B6",
          700: "#4C1D95",
          800: "#3B0764",
          900: "#2E1065",
        },
        orange: {
          200: "#FED7AA",
          300: "#FCA775",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        dark: {
          400: "#3D3D52",
          500: "#2E2E3F",
          600: "#22222F",
          700: "#1A1A24",
          800: "#13131A",
          900: "#0D0D12",
          950: "#0A0A10",
        },
        // Surface tokens (work in light + dark via CSS vars)
        surface: {
          base: "rgb(var(--color-surface-base) / <alpha-value>)",
          raised: "rgb(var(--color-surface-raised) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
          border: "rgb(var(--color-surface-border) / <alpha-value>)",
        },
        ink: {
          primary: "rgb(var(--color-ink-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-ink-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-ink-tertiary) / <alpha-value>)",
          inverse: "rgb(var(--color-ink-inverse) / <alpha-value>)",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.7s ease-out forwards",
        "slide-down": "slideDown 0.4s ease-out forwards",
        "pulse-slow": "pulseSlow 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        gradient: "gradient 8s linear infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "grid-purple":
          "linear-gradient(to right, rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,58,237,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
