import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/stellar-diagnostic-events-view-proto/',
  server: {
    port: 3000
  }
})