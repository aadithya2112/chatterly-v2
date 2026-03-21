import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { requireAuth } from './middleware/auth'
import { widgetRoutes } from './routes/widgets'
import { chatRoutes } from './routes/chat'
import { corsConfig } from './config/cors'
import { config } from './config/env'
import { rateLimitConfig } from './config/rate-limit'

const server = Fastify({
  logger: true
})

async function main() {
  // Load and validate environment before serving traffic.
  void config

  // Register plugins
  await server.register(cors, corsConfig)
  
  await server.register(helmet)
  
  await server.register(rateLimit, rateLimitConfig)


  // Health check
  server.get('/health', async () => {
    return { status: 'ok' }
  })

  // Register Routes
  await server.register(widgetRoutes, { prefix: '/api/widgets' })
  await server.register(chatRoutes, { prefix: '/api/chat' })

  // Protected route to test auth and user sync
  server.get('/api/me', { preHandler: requireAuth }, async (request, reply) => {
    return { user: (request as any).user }
  })

  try {
    await server.listen({ port: config.PORT, host: config.HOST })
    const port = config.PORT
    console.log(`Server listening on port ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
