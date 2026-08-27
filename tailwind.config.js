/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D17', // Very dark blue/black
        surface: '#151722',
        primary: '#C1B6FC', // Pastel Purple
        secondary: '#A3D9B1', // Pastel Green
        accent: '#F3B4C1', // Pastel Pink
        textMain: '#F8F9FA',
        textMuted: '#A0A4B8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
