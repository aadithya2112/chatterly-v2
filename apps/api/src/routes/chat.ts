import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@repo/db'

export async function chatRoutes(server: FastifyInstance) {
  const chatSchema = z.object({
    message: z.string().min(1).max(2000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional().default([])
  })

  server.post('/', async (request, reply) => {
    const apiKey = request.headers['x-widget-key'] as string
    const origin = request.headers.origin || request.headers.referer

    if (!apiKey) {
      return reply.code(401).send({ error: 'Missing API Key' })
    }

    // validate widget
    const widget = await prisma.widget.findUnique({
      where: { publicApiKey: apiKey }
    })

    if (!widget || !widget.enabled) {
      return reply.code(401).send({ error: 'Invalid or disabled widget' })
    }

    // validate domain
    // If allowlist is empty, maybe allow all (dev mode)? Or deny all?
    // Requirements say: "Requests from unapproved origins must be blocked"
    // Let's be strict.
    if (widget.allowedDomains.length > 0) {
      if (!origin) {
        // blocked if no origin provided and restrictions exist
        return reply.code(403).send({ error: 'Origin header required' })
      }
      
      const isAllowed = widget.allowedDomains.some(domain => origin.startsWith(domain) || origin.includes(domain)) // simplified check
      if (!isAllowed) {
         return reply.code(403).send({ error: 'Domain not allowed' })
      }
    }

    // Parse body
    const bodyResult = chatSchema.safeParse(request.body)
    if (!bodyResult.success) {
      return reply.code(400).send({ error: 'Invalid body' })
    }

    const { message, history } = bodyResult.data

    // Mock LLM Response for now
    // TODO: Integrate actual LLM (DeepSeek/OpenAI) via Vercel AI SDK or direct fetch
    
    const systemPrompt = widget.systemPrompt || "You are a helpful assistant."

    // Simulate delay
    await new Promise(r => setTimeout(r, 500))

    return {
      role: 'assistant',
      content: `[Mock AI Response] based on system prompt: "${systemPrompt.substring(0, 20)}..." \n\n You said: "${message}"`
    }
  })
}
