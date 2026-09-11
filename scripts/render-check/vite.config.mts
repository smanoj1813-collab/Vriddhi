// Vite config for `npm run test:render`.
//
// Same `@` alias as the app config, but the I/O boundary is swapped for the
// stubs in ./stubs so the components mount for real without a network, a
// Firebase project, or a signed-in session. Everything under test — the
// component, its hooks, and the aggregation in staffAttendanceStats — is the
// shipped source.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const stub = (f: string) => path.resolve(here, 'stubs', f);

export default defineConfig({
  root,
  plugins: [react()],
  logLevel: 'error',
  resolve: {
    alias: [
      // Order matters: the specific '@' aliases must precede the bare fallback.
      { find: '@/modules/auth/context/AuthContext', replacement: stub('AuthContext.ts') },
      { find: '@/shared/api/staffAttendanceApi', replacement: stub('staffAttendanceApi.ts') },
      { find: '@/Firebase/config', replacement: stub('firebaseConfig.ts') },
      { find: /^firebase\/firestore$/, replacement: stub('firestore.ts') },
      { find: /^react-router-dom$/, replacement: stub('react-router-dom.tsx') },
      { find: '@', replacement: path.resolve(root, './src') },
    ],
  },
  // Deliberately NOT forcing `ssr.noExternal`: packages such as
  // use-sync-external-store and jspdf ship CJS, and having Vite transform them
  // as ESM fails with "module is not defined". Leaving node_modules external
  // lets node's own CJS loader handle them while Vite still transforms the app
  // source and the stubs.
});
