import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'

export default defineConfig({
  plugins: [
    laravel({
      input: ['src/main.tsx'], // Tell Laravel about your src directory
      refresh: true,
    }),
    react(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    cors: true
  }
})