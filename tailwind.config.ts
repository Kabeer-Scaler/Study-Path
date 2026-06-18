import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Raw palette tokens (always the same hue regardless of theme)
        "powder-blush": "#ffa69e",
        "vanilla-cream": "#faf3dd",
        "icy-aqua": "#b8f2e6",
        "light-blue": "#aed9e0",
        "blue-slate": "#5e6472",
        // Semantic tokens (swap via CSS variables for dark mode)
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--c-surface-muted) / <alpha-value>)",
        ink: "rgb(var(--c-text) / <alpha-value>)",
        muted: "rgb(var(--c-muted-text) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--c-accent-soft) / <alpha-value>)",
        highlight: "rgb(var(--c-highlight) / <alpha-value>)",
        "highlight-soft": "rgb(var(--c-highlight-soft) / <alpha-value>)",
        secondary: "rgb(var(--c-secondary) / <alpha-value>)",
        line: "rgb(var(--c-border) / <alpha-value>)",
        ring: "rgb(var(--c-ring) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(94, 100, 114, 0.10)",
        glow: "0 10px 40px -10px rgba(255, 166, 158, 0.45)",
        aqua: "0 10px 40px -10px rgba(184, 242, 230, 0.6)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        "float-drift": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(18px,-14px) scale(1.05)" },
          "66%": { transform: "translate(-12px,10px) scale(0.97)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(-4%,3%,0) rotate(8deg)" }
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(255,166,158,0.55), 0 0 24px 0 rgba(184,242,230,0.25)"
          },
          "50%": {
            boxShadow:
              "0 0 0 10px rgba(255,166,158,0), 0 0 40px 4px rgba(184,242,230,0.45)"
          }
        },
        "stagger-fade": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" }
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" }
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" }
        },
        "progress-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
        "scale-in": "scale-in 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-drift": "float-drift 14s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "stagger-fade": "stagger-fade 0.5s ease-out both",
        typewriter: "typewriter 2.2s steps(40, end) forwards",
        blink: "blink 1s step-end infinite",
        "dot-bounce": "dot-bounce 1.2s ease-in-out infinite",
        "progress-sweep": "progress-sweep 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
