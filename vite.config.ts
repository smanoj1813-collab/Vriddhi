import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const plugins = [react()]
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
