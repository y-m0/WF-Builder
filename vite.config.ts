/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173, // Default Vite port, can be adjusted
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend server address
        changeOrigin: true, // Recommended for proper proxying
        // secure: false, // Uncomment if backend is http and vite dev server is https
        // rewrite: (path) => path.replace(/^\/api/, ''), // Not needed if backend expects /api prefix
      }
    }
  }
})
