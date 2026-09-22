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
      // …and the relative spelling a page inside the same module uses
      // ('../../auth/context/AuthContext' from the student pages).
      { find: /(?:\.\.\/)+auth\/context\/AuthContext$/, replacement: stub('AuthContext.ts') },
      { find: '@/shared/api/staffAttendanceApi', replacement: stub('staffAttendanceApi.ts') },
      { find: '@/shared/services/prepContentService', replacement: stub('prepContentService.ts') },
      { find: '@/Firebase/config', replacement: stub('firebaseConfig.ts') },
      // Relative spellings of the same module ('../../../Firebase/config' from
      // the student API layer). Without this the real config initialises the
      // Firebase SDK and every render that reaches a callable dies on
      // `auth/invalid-api-key` instead of on the assertions.
      { find: /(?:\.\.\/)+Firebase\/config$/, replacement: stub('firebaseConfig.ts') },
      // The student shell reads its identity from a context provider; the stub
      // lets a page mount without the whole data layer.
      // The student shell reads its identity from a context provider; these
      // stubs let a page mount without the whole data layer. Exact specifiers,
      // because a regex alias replaces only the matched span and would eat the
      // './' of a relative import.
      { find: '@/modules/student/hooks/useStudentData', replacement: stub('useStudentData.ts') },
      { find: '../hooks/useStudentData', replacement: stub('useStudentData.ts') },
      { find: './useStudentData', replacement: stub('useStudentData.ts') },
      // A string `find` (not a regex) because Vite replaces only the matched
      // span: a regex that does not anchor at ^ would leave the '@/' prefix on.
      { find: '@/shared/providers/NotificationProvider', replacement: stub('notificationProvider.ts') },
      { find: /^firebase\/firestore$/, replacement: stub('firestore.ts') },
      { find: /^firebase\/functions$/, replacement: stub('functions.ts') },
      // The app config's VitePWA plugin owns this virtual module; swap it for
      // a no-op so the module graph can resolve without the plugin chain.
      { find: 'virtual:pwa-register/react', replacement: stub('pwaRegister.ts') },
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
