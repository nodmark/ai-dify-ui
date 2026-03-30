import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const difyOrigin = env.VITE_DIFY_ORIGIN || 'http://127.0.0.1'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      proxy: {
        '/dify-proxy': {
          target: difyOrigin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/dify-proxy/, ''),
        },
      },
    },
  }
})
