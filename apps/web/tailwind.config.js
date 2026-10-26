/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151f32',
          950: '#070b14',
        },
        mlh: {
          navy: '#0B1E36',
          blue: '#0055D4',
          yellow: '#F59E0B',
          yellowHover: '#D97706',
          amber: '#B45309',
          red: '#EF4444',
          green: '#10B981',
          canvas: '#F8FAFC',
        }
      },
      boxShadow: {
        'mlh-sm': '2px 2px 0px #0B1E36',
        'mlh': '4px 4px 0px #0B1E36',
        'mlh-lg': '6px 6px 0px #0B1E36',
        'mlh-yellow': '4px 4px 0px #F59E0B',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
