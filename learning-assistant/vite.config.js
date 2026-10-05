import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const localRoadmapPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'src',
  'data',
  'sampleData.json'
)

const localRoadmapPlugin = {
  name: 'serve-local-roadmap',
  configureServer(server) {
    server.middlewares.use('/local-roadmap.json', async (request, response, next) => {
      const remoteAddress = request.socket.remoteAddress
      if (
        remoteAddress &&
        !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)
      ) {
        response.statusCode = 404
        response.end()
        return
      }

      try {
        const roadmap = await readFile(localRoadmapPath)
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(roadmap)
      } catch (error) {
        if (error.code === 'ENOENT') {
          response.statusCode = 404
          response.end()
          return
        }
        next(error)
      }
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localRoadmapPlugin],
})
