/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        an: {
          bg:          "#0B0C0D",
          surface:     "#111315",
          "surface-2": "#181A1C",
          border:      "#1E2226",
          "border-2":  "#282E34",
          accent:      "#CC4B37",
          "accent-h":  "#D95540",
          text:        "#EDEDEB",
          "text-dim":  "#8A8A88",
          muted:       "#4A4A48",
        },
      },
      fontFamily: {
        display: ["'Jost'",    "sans-serif"],
        body:    ["'Lato'",    "sans-serif"],
        ui:      ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
