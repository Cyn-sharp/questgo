/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "Helvetica", "sans-serif"],
        outfit: ["var(--font-outfit)", "Helvetica", "sans-serif"],
      },
      colors: {
        maroon: "#7a1f32",
        "maroon-dark": "#4e0f1e",
        gold: "#c9a227",
        cream: "#fbf8f0",
      },
    },
  },
  plugins: [],
};