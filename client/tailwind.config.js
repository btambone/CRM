/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f0ff",
          100: "#e6e2ff",
          200: "#cfc6ff",
          300: "#ada0ff",
          400: "#8a75ff",
          500: "#6f4dff",
          600: "#5c2ef0",
          700: "#4c22cc",
          800: "#3f1ea3",
          900: "#361c81",
          950: "#210f52",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
