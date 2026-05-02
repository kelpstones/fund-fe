import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        fundraise: {
          primary: "#16a34a",
          secondary: "#2563eb",
          accent: "#22d3ee",
          neutral: "#111827",
          "base-100": "#ffffff",
          "base-200": "#f6f7fb",
          "base-300": "#e7eaf2",
          info: "#2563eb",
          success: "#16a34a",
          warning: "#f59e0b",
          error: "#dc2626",
        },
      },
    ],
  },
};
