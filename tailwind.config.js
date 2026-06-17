/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        walnut: {
          50: '#FAF7F5',
          100: '#EDE6DF',
          200: '#D4C3B0',
          300: '#B89A7D',
          400: '#9C7A56',
          500: '#8B5A2B',
          600: '#5D3A1A',
          700: '#3E2723',
          800: '#2C1810',
          900: '#1A0F0A',
        },
        gold: {
          50: '#FFFBEB',
          100: '#FFF3C4',
          200: '#FBE58C',
          300: '#F6D45F',
          400: '#E8C547',
          500: '#D4AF37',
          600: '#B8941F',
          700: '#927315',
          800: '#6E5610',
          900: '#4A3A0B',
        },
        ivory: '#FFF8E7',
        mocha: '#8D6E63',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 8px 24px 0 rgba(212, 175, 55, 0.35)',
        'walnut': '0 4px 14px 0 rgba(62, 39, 35, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
