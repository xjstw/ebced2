import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug için
  console.log('Vite Config - Mode:', mode)
  console.log('Vite Config - Command:', command)
  console.log('Vite Config - Env:', env)
  
  return {
    plugins: [react()],
    define: {
      // Expose .env variables to the frontend
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || ''),
      __MODE__: JSON.stringify(mode),
      __PROD__: mode === 'production'
    },
    server: {
      port: 5173,
      host: true,
      cors: true
    }
  }
})
