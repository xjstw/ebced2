import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Expose .env variables to the frontend
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || ''),
      __MODE__: JSON.stringify(mode)
    },
    server: {
      port: 5173,
      host: true,
      cors: true
    }
  }
})
