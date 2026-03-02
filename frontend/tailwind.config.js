/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        air: {
          bg: "#080C0A",
          surface: "#0F1612",
          border: "#1C2A20",
          green: "#2ECC71",
          "green-dim": "#1A7A42",
          orange: "#F97316",
          muted: "#4A6350",
          text: "#E8F0EA",
          "text-dim": "#7A9980",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
