import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Vriddhi Academic Cloud',
        short_name: 'Vriddhi',
        description: 'Vriddhi — Academic Management System for Colleges',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // `minimal-ui` lets a phone that cannot honour standalone (older
        // iOS Add-to-Home-Screen, some WebView launchers) still open the app
        // chrome-free-ish instead of falling back to a full browser tab.
        display_override: ['standalone', 'minimal-ui', 'browser'],
        // Portrait keeps an exam layout stable — a mid-test rotation would
        // otherwise reflow the question card and the thumb navigation bar.
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0d9488',
        lang: 'en',
        categories: ['education', 'productivity'],
        // Long-press the app icon → jump straight to what a student opens most.
        shortcuts: [
          {
            name: 'My Tests',
            short_name: 'Tests',
            description: 'Scheduled and ongoing assessments',
            url: '/student/assessments',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Fees & Challans',
            short_name: 'Fees',
            description: 'Fee ledger and university exam fee challans',
            url: '/student/challans',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Attendance',
            short_name: 'Attendance',
            description: 'Your attendance record',
            url: '/student/attendance',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Hashed build assets + index.html are precached. sw.js is served
        // with no-cache (firebase.json), so every new deploy is detected on
        // the next open and PwaPrompts offers a one-tap reload — users are
        // never stuck on a stale build.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        globIgnores: ['**/stats.html'],
        navigateFallback: '/index.html',
        // Never intercept API / Firebase traffic — the SPA fallback would
        // otherwise answer callable-function and auth-helper URLs with HTML.
        navigateFallbackDenylist: [/^\/api\//, /^\/__\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Firestore / Functions / Auth are never served from cache.
            urlPattern: /^https:\/\/(firestore|identitytoolkit|securetoken|.*cloudfunctions)\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ]
  const env = loadEnv(mode, process.cwd(), '')

  // Bundle analyzer only when ANALYZE=true
  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      })
    )
  }

  // Dev-only proxy so `npm run dev` exercises the real `api` Cloud Function
  // instead of the SPA. Same-origin `/api/*` requests are forwarded to the
  // Functions emulator (`firebase emulators:start --only functions`), whose
  // Express app also mounts every route under `/api/*`. Opt in by setting
  // `VITE_API_BASE_URL=/api` in `.env.local`; override the target with
  // `VITE_DEV_API_PROXY_TARGET` (e.g. a deployed function) when needed.
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'vriddhi-academic'
  const apiProxyTarget =
    env.VITE_DEV_API_PROXY_TARGET || `http://localhost:5001/${projectId}/asia-south1/api`
  // Item 4.4: the Chrome-launching PDF routes now live in their own function.
  // Same idea as the /api proxy above — the browser calls same-origin `/pdf/*`
  // and the dev server forwards to the emulator's `pdf` function.
  const pdfProxyTarget =
    env.VITE_DEV_PDF_PROXY_TARGET || `http://localhost:5001/${projectId}/asia-south1/pdf`

  return {
    plugins,
    base: '/',  // Required for Firebase Hosting root deploy
    // Dev server: bind to all interfaces and accept the preview proxy host
    // (the Arena preview routes through a *.e2b.app host, not localhost).
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          // http-proxy appends the incoming path to the target path. The target
          // already ends in the function name (`/api`), so strip the browser's
          // `/api` prefix: `/api/ai/chat` → `<target>/ai/chat`, which is exactly
          // what the deployed function receives in production.
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
        '/pdf': {
          target: pdfProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/pdf/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 500,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-core': ['react', 'react-dom', 'react-router-dom'],
            'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
            'mui-icons': ['@mui/icons-material'],
            'firebase': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/database',
              'firebase/storage',
            ],
            'charts': ['recharts'],
            'pdf': ['jspdf', 'html2canvas'],
            'utils': ['framer-motion'],
          },
        },
      },
    },
  }
})
