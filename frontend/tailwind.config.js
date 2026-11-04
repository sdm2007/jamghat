/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#004643',
          dark: '#001e1d',
        },
        sage: '#abd1c6',
        gold: {
          DEFAULT: '#f9bc60',
          hover: '#e8a94b',
        },
        coral: '#e16162',
        surface: {
          DEFAULT: '#e8e4e6',
          headline: '#fffffe',
        }
      }
    },
  },
  plugins: [],
}