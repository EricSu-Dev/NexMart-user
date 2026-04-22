import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8085,
    proxy: {
      // 开发时把 /api 请求转发到后端，避免跨域
      '/api': {
        target: 'http://localhost:8087',
        changeOrigin: true
      }
    }
  }
})
