import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Three.js / R3F are only reached through the lazy NetworkCanvas import, so
// they land in their own async chunk and never block the first paint of the
// HTML content. React and GSAP get stable vendor chunks for better caching.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(gsap|@gsap|lenis)\//.test(id)) return 'gsap'
          return undefined
        },
      },
    },
  },
})
