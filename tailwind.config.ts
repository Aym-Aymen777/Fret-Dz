import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Primary palette: deep navy ── */
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#1e3a8a", // brand navy
          600: "#1e3370",
          700: "#172b5e",
          800: "#10224d",
          900: "#0a1833",
          DEFAULT: "#1e3a8a",
          foreground: "#ffffff",
        },
        /* ── Secondary: electric amber ── */
        secondary: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // brand amber
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          DEFAULT: "#f59e0b",
          foreground: "#0a1833",
        },
        /* ── Accent: electric teal ── */
        accent: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          DEFAULT: "#06b6d4",
          foreground: "#ffffff",
        },
        /* ── Muted grays ── */
        muted: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          DEFAULT: "#64748b",
          foreground: "#f8fafc",
        },
        /* ── Semantic ── */
        success: { DEFAULT: "#10b981", foreground: "#ffffff" },
        warning: { DEFAULT: "#f59e0b", foreground: "#0a1833" },
        danger:  { DEFAULT: "#ef4444", foreground: "#ffffff" },
        info:    { DEFAULT: "#3b82f6", foreground: "#ffffff" },
        /* ── Surface tokens ── */
        background: {
          DEFAULT: "#f8fafc",   // light bg
          dark:    "#0f172a",   // dark bg
        },
        surface: {
          DEFAULT: "#ffffff",
          dark:    "#1e293b",
        },
        border: {
          DEFAULT: "#e2e8f0",
          dark:    "#334155",
        },
        foreground: {
          DEFAULT: "#0f172a",
          muted:   "#64748b",
          dark:    "#f1f5f9",
        },
      },

      /* ── Typography ── */
      fontFamily: {
        sans:  ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Outfit", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs:    ["0.75rem",  { lineHeight: "1rem" }],
        sm:    ["0.875rem", { lineHeight: "1.25rem" }],
        base:  ["1rem",     { lineHeight: "1.5rem" }],
        lg:    ["1.125rem", { lineHeight: "1.75rem" }],
        xl:    ["1.25rem",  { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.5rem" }],
        "5xl": ["3rem",     { lineHeight: "1.15" }],
      },

      /* ── Border radius ── */
      borderRadius: {
        none: "0",
        sm:   "0.25rem",
        DEFAULT: "0.5rem",
        md:   "0.5rem",
        lg:   "0.75rem",
        xl:   "1rem",
        "2xl":"1.5rem",
        "3xl":"2rem",
        full: "9999px",
      },

      /* ── Shadows ── */
      boxShadow: {
        xs:   "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm:   "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        DEFAULT:"0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        md:   "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)",
        lg:   "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
        xl:   "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
        "2xl":"0 25px 50px -12px rgb(0 0 0 / 0.18)",
        inner:"inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        glow: "0 0 20px -4px rgb(30 58 138 / 0.4)",
        "glow-amber": "0 0 20px -4px rgb(245 158 11 / 0.5)",
        none: "none",
      },

      /* ── Spacing extras ── */
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "72":  "18rem",
        "84":  "21rem",
        "96":  "24rem",
      },

      /* ── Transitions ── */
      transitionDuration: {
        "0":   "0ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      /* ── Animation ── */
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-out both",
        "slide-in": "slideIn 0.3s ease-out both",
        "pulse-slow":"pulse2 2s ease-in-out infinite",
        shimmer:    "shimmer 1.8s linear infinite",
      },

      /* ── Z-index scale ── */
      zIndex: {
        "0":   "0",
        "10":  "10",
        "20":  "20",
        "30":  "30",
        "40":  "40",
        "50":  "50",
        "navbar": "100",
        "modal":  "200",
        "toast":  "300",
      },
    },
  },
  plugins: [],
};

export default config;
