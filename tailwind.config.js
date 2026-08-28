/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ← ADD THIS LINE
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vriddhi-dark': '#0f172a',
        'vriddhi-primary': '#14b8a6',
        'vriddhi-accent': '#14b8a6',
        'vriddhi-light': '#f0fdfa',
        'vriddhi-text': '#e2e8f0',
        'vriddhi-card': '#1e293b',
        'vriddhi-border': '#334155',
        'vriddhi-muted': '#94a3b8',
        'vriddhi-success': '#22c55e',
        'vriddhi-warning': '#f59e0b',
        'vriddhi-danger': '#ef4444',
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: [
          'var(--vriddhi-font-family)',
          'Inter',
          'Noto Sans',
          'Noto Sans Kannada',
          'Noto Sans Tamil',
          'Noto Sans Telugu',
          'Noto Sans Malayalam',
          'Noto Sans Devanagari',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}