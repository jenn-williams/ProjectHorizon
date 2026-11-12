import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ProjectHorizon/',
  build: {
    // Automatically extracts all bundled dependency licenses into dist/.vite/license.md
    license: true,
  },
})
