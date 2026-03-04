/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        background: "#0B0B0C",
        surface: "#121214",
        border: "#1C1C20",
        "text-primary": "#F2F2F2",
        "text-muted": "#A0A0A8",
        "red-accent": "#e60000",
        "red-glow": "rgba(230,0,0,0.15)",
        primary: {
          DEFAULT: "#e60000",
          foreground: "#0B0B0C",
        },
        secondary: {
          DEFAULT: "#121214",
          foreground: "#F2F2F2",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f8fafc",
        },
        muted: {
          DEFAULT: "#1C1C20",
          foreground: "#A0A0A8",
        },
        accent: {
          DEFAULT: "#1C1C20",
          foreground: "#F2F2F2",
        },
        popover: {
          DEFAULT: "#121214",
          foreground: "#F2F2F2",
        },
        input: "#1C1C20",
        ring: "#C9A227",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      boxShadow: {
        gold: "0 0 15px 0 rgba(201, 162, 39, 0.3)",
      },
    },
  },
  plugins: [],
};
