/** @type {import('tailwindcss').Config} */
// SmartClinic design tokens.
// Royal purple carries the brand; warm sand neutrals, ochre, clay and leaf
// give the product its West African warmth without leaning on one locale.
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f3fd',
          100: '#ece6fb',
          200: '#dacdf6',
          300: '#bfa8ee',
          400: '#9c79e2',
          500: '#7d52d3',
          600: '#6a3cc4',
          700: '#5a2fae',
          800: '#4a268e',
          900: '#3b1f70',
          950: '#241345',
        },
        // Aubergine-black used for body text and premium dark surfaces.
        ink: {
          DEFAULT: '#1d1530',
          soft: '#4a4358',
          muted: '#6f6880',
        },
        // Warm paper neutrals instead of cold greys.
        sand: {
          50: '#fbf8f3',
          100: '#f5efe5',
          200: '#ebe2d3',
          300: '#dccdb4',
          400: '#bfa985',
        },
        // Sahel sunlight: rewards, highlights, the "today" accent.
        ochre: {
          50: '#fdf7ea',
          100: '#fbedd0',
          300: '#f0c46b',
          500: '#d99a2b',
          700: '#94600f',
        },
        // Terracotta: attention without alarm.
        clay: {
          50: '#fcf1ed',
          100: '#f8e1d8',
          500: '#c2553a',
          700: '#8f3a25',
        },
        // Wellbeing and completed states.
        leaf: {
          50: '#eef7f2',
          100: '#d6eee2',
          300: '#8fcbae',
          500: '#2e8a64',
          700: '#1f6149',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 45px -24px rgba(36, 19, 69, 0.28)',
        card: '0 1px 2px rgba(29, 21, 48, 0.04), 0 8px 24px -12px rgba(29, 21, 48, 0.12)',
        lift: '0 2px 4px rgba(29, 21, 48, 0.04), 0 18px 40px -18px rgba(36, 19, 69, 0.32)',
      },
    },
  },
};
