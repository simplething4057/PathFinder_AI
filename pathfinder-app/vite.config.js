import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // 청크 크기 경고 임계값 (기본 500kb → 800kb로 완화)
    chunkSizeWarningLimit: 800,

    rollupOptions: {},
  },
})
