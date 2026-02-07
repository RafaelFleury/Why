/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#000000",
        "card-hover": "#080808",
        border: "#2f3336",
        accent: "#1d9bf0",
        "accent-dim": "#1a8cd8",
        "text-primary": "#e7e9ea",
        "text-secondary": "#71767b",
        "text-muted": "#536471",
        danger: "#f4212e",
        warning: "#ffd400",
        success: "#00ba7c",
      },
    },
  },
  plugins: [],
};
