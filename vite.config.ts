import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const plugins = [react()]

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

  return {
    plugins,
    base: '/',  // Required for Firebase Hosting root deploy
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