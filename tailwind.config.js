/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-red': '#DC2626',
        'brand-yellow': '#FFFE45',
        'card': '#1a1a1a',
        'card-secondary': '#242424',
      },
    },
  },
  plugins: [],
}
