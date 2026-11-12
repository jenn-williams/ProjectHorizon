import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ProjectHorizon/',
  build: {
    license: {
      fileName: 'THIRD-PARTY-LICENSES.txt'
    }
  },
});
