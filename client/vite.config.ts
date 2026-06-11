import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Match the server's CLIENT_URL (http://localhost:3000) so CORS + cookies work.
  server: { port: 3000 },
})
