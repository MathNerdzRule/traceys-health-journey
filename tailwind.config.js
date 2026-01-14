/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "brand-surface": "var(--color-surface)",
        "brand-primary": "var(--color-primary)",
        "brand-primary-light": "var(--color-primary-light)",
        "brand-secondary": "var(--color-secondary)",
        "brand-accent": "var(--color-accent)",
        "brand-text-primary": "var(--color-text-primary)",
        "brand-text-secondary": "var(--color-text-secondary)",
        "brand-danger": "var(--color-danger)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
