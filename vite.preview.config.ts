// ═══════════════════════════════════════════════════════════════════════
// vite.preview.config.ts — Local UI preview for the Academic Calendar.
// Aliases the Firestore API to an in-memory mock so the component can be
// viewed without Firebase credentials. Not used by `npm run build`.
//   npx vite --config vite.preview.config.ts
// ═══════════════════════════════════════════════════════════════════════

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'preview'),
  publicDir: false,
  resolve: {
    alias: [
      // Must come before the generic '@' alias
      {
        find: /^@\/shared\/api\/academicCalendarApi$/,
        replacement: path.resolve(__dirname, 'preview/mockCalendarApi.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    allowedHosts: true,
  },
});
