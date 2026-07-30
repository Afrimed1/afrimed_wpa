/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#eef3f8',
          100: '#d4e0ed',
          200: '#a9c1db',
          300: '#7ea2c9',
          400: '#5383b7',
          500: '#1e3a5f',
          600: '#1a3252',
          700: '#152a45',
          800: '#102238',
          900: '#0b1a2b',
        },
        secondary: {
          DEFAULT: '#0d9488',
          50: '#ecfdf8',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        accent: {
          DEFAULT: '#c45c3e',
          50: '#fdf3f0',
          100: '#fae4dc',
          200: '#f4c4b3',
          300: '#e99a7f',
          400: '#d97757',
          500: '#c45c3e',
          600: '#a84832',
          700: '#8c3828',
          800: '#702e22',
          900: '#5a251c',
        },
        surface: {
          DEFAULT: '#f4f6f8',
          card: '#ffffff',
          muted: '#e8ecf0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(30 58 95 / 0.08), 0 1px 2px -1px rgb(30 58 95 / 0.06)',
        elevated:
          '0 4px 6px -1px rgb(30 58 95 / 0.1), 0 2px 4px -2px rgb(30 58 95 / 0.08)',
      },
    },
  },
  plugins: [],
}
