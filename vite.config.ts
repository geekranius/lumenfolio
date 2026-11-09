import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend lives in ./frontend and builds into ./public (served by the Worker
// as static assets). In development the Worker runs on :8787 and Vite proxies
// /api and /files to it.
export default defineConfig({
  root: 'frontend',
  base: '/',
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/files': 'http://localhost:8787',
    },
  },
})
