/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        seafoam: {
          DEFAULT: '#2e9e7b',
          light: '#4fd1a5',
          soft: '#dff2ec',
          hover: '#238264',
        },
        charcoal: {
          DEFAULT: '#181c1c',
          dark: '#121515',
          card: '#1b2020',
          elevated: '#242b2a',
        },
      }
    },
  },
  plugins: [],
}