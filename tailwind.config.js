/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // brand: {
        //   50: '#f5f3ff', // very light tint
        //   100: '#ede9fe', // light tint
        //   200: '#ddd6fe', // light
        //   300: '#c4b5fd', // lighter mid
        //   400: '#a78bfa', // mid-light
        //   500: '#8b5cf6', // mid
        //   600: '#7c3aed', // mid-dark
        //   700: '#7139d6', // primary
        //   800: '#5b21b6', // dark
        //   900: '#4c1d95', // darkest
        // },
        brand: {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#7139d6',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
},
        ink: '#17342f',
      },
      boxShadow: { soft: '0 18px 45px -24px rgba(15, 76, 69, 0.28)' },
    },
  },
};
