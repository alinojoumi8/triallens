import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { entries: ['index.html'] },
  server: {
    watch: { ignored: ['**/tmp/**', '**/data/**', '**/coverage/**'] },
    proxy: {
      '/api': process.env.VITE_API_TARGET ?? 'http://127.0.0.1:5174',
    },
  },
  test: {
    coverage: { provider: 'v8', reporter: ['text', 'json-summary', 'json'], include: ['server/**/*.ts', 'src/**/*.ts', 'src/**/*.tsx'], exclude: ['server/index.ts'] },
    environment: 'node',
    include: ['tests/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
