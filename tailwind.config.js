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
        // Brand/accent palette — driven by CSS variables (src/shared/theme/accent.ts)
        // so the Settings → Accent Color choice re-colours the app at runtime.
        teal: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
          950: 'rgb(var(--accent-950) / <alpha-value>)',
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