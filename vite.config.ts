import type { ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { runGenerate, type GenerateRequestLike } from './api/generate'

function generateApi(): Plugin {
  return {
    name: 'nutrilora-generate',
    configureServer(server) {
      server.middlewares.use('/api/generate', (req, res, next) => {
        void runGenerate(req as GenerateRequestLike)
          .then((result) => {
            const response = res as ServerResponse
            response.statusCode = result.status
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            response.end(JSON.stringify(result.json))
          })
          .catch(next)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), generateApi()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
