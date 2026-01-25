import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { requireAuth } from './middleware/auth'
import { widgetRoutes } from './routes/widgets'
import { chatRoutes } from './routes/chat'
import dotenv from 'dotenv'

dotenv.config()

const server = Fastify({
  logger: true
})

async function main() {
  // Register plugins
  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins for now, specific logic would go here
      cb(null, true)
    }
  })
  
  await server.register(helmet)
  
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })


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
    const port = parseInt(process.env.PORT || '3001')
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server listening on port ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
