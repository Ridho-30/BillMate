import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ocr': {
        target: 'https://ox-flow-backend.vercel.app',
        changeOrigin: true,
      },
    },
  },
})

