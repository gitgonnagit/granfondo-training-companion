import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: "./"` keeps asset paths relative so the site works whether it's
// hosted at a project-page URL (e.g. /repo-name/) or a user-page URL.
// See build.md §9.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    host: true,
    port: 5173,
  },
})
