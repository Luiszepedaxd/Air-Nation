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
          bg:         "#FFFFFF",
          surface:    "#F4F4F4",
          surface2:   "#F0F0F0",
          border:     "#EEEEEE",
          border2:    "#E0E0E0",
          accent:     "#CC4B37",
          "accent-h": "#D95540",
          text:       "#111111",
          "text-dim": "#444444",
          muted:      "#767676",
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
