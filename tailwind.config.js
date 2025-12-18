/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kita buat palet warna gelap custom biar elegan
        dark: {
          900: '#0a0a0a', // Background utama (sangat gelap)
          800: '#171717', // Background card
          700: '#262626', // Border
        },
        primary: {
          500: '#3b82f6', // Biru uiverse
          600: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}