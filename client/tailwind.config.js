/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf6',
          100: '#d7f7e9',
          200: '#b1eed5',
          300: '#7dddbb',
          400: '#43c49c',
          500: '#1fa881',
          600: '#148767',
          700: '#126c53',
          800: '#125644',
          900: '#114739',
          950: '#042820',
        },
        impact: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        dark: {
          800: '#131b26',
          900: '#0b111a',
          950: '#070b11',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
