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
          bg: "#0D0F0E",
          surface: "#181C1A",
          border: "#252E29",
          green: "#4ADE80",
          "green-dim": "#1A7A42",
          orange: "#F59E0B",
          muted: "#4A6350",
          text: "#ECFDF5",
          "text-dim": "#86EFAC",
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
