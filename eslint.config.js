// Frontend lint (src/). Flat config, ESLint 9.
// Starts with the recommended JS + TypeScript rules and the React hooks rules;
// the bar is "no new findings", enforced by `npm run lint` in CI.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'functions/**',
      'node_modules/**',
      'scripts/**',
      'public/**',
      'marketing/**',
      'brand/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2024 },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // ---- Warnings (reported, not blocking) ----
      // These are real code-quality findings, but fixing them is a refactor
      // (typing ~680 `any`s, React-compiler patterns, removing unused code).
      // `npm run lint` caps the warning count at its current level so new
      // ones cannot land; lower the cap as they are fixed.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },
);
