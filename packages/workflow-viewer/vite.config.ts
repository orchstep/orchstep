import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'standalone',
  resolve: {
    alias: {
      '@orchstep/workflow-viewer': resolve(__dirname, 'src/index.ts'),
    },
  },
})
