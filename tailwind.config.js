/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        sage: {
          DEFAULT: '#8B9B8E',
          light: '#A8B5AA',
          dark: '#6E7D71',
        },
        'deep-green': {
          DEFAULT: '#3D5A4C',
          light: '#526B5E',
          dark: '#2D4438',
        },
        rose: {
          DEFAULT: '#D4A5A5',
          light: '#E5C5C5',
          dark: '#C08585',
        },
        gold: {
          DEFAULT: '#C9A961',
          light: '#D9C081',
          dark: '#B99341',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
