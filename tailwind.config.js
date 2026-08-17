/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf7',
          100: '#d5f5ea',
          200: '#acebd9',
          500: '#15947f',
          600: '#0f766e',
          700: '#105f59',
          800: '#124c48',
          900: '#123f3c',
        },
        ink: '#17342f',
      },
      boxShadow: { soft: '0 18px 45px -24px rgba(15, 76, 69, 0.28)' },
    },
  },
};
