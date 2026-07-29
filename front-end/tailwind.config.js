/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1e293b',
          navyDark: '#0f172a',
          navyLight: '#334155',
          accent: '#b8801f',
          paper: '#eef2f8',
          line: '#dbe2ee',
        },
      },
    },
  },
  plugins: [],
}