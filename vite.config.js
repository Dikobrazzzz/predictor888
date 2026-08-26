import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mockApi from './dev/mock-api'

export default defineConfig({
  // mockApi отвечает на /api/* только в `npm run dev` (apply: 'serve').
  plugins: [react(), mockApi()],
  base: '/',
})
