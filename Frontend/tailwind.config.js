/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ev: {
          deep: '#020711',
          panel: '#06111f',
          blue: '#008cff',
          cyan: '#4de7ff',
          red: '#ff2b2b',
        },
      },
    },
  },
  plugins: [],
}
