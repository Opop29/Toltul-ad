/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // ✅ Use proper Browserslist queries
      targets: [
        'defaults',
        'chrome >= 89',
        'edge >= 89',
        'firefox >= 83',
        'safari >= 13'
      ]
    })
  ],
  base: "/Toltul-ad/",   // ✅ add leading and trailing slash
  build: {
    target: 'es2022',            // ✅ allows bigint literals
    chunkSizeWarningLimit: 1000  // optional: silence large bundle warnings
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
