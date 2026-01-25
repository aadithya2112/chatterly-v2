import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@repo/db'
import { requireAuth, requireWidgetOwnership } from '../middleware/auth'
import crypto from 'crypto'

export async function widgetRoutes(server: FastifyInstance) {
  // Schema for creating a widget
  const createWidgetSchema = z.object({
    name: z.string().min(1).max(100),
    systemPrompt: z.string().min(1).max(5000),
    allowedDomains: z.array(z.string().url()).optional().default([]),
  })

  // Schema for updating a widget
  const updateWidgetSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    systemPrompt: z.string().min(1).max(5000).optional(),
    allowedDomains: z.array(z.string().url()).optional(),
    enabled: z.boolean().optional(),
  })

  // List all widgets for the user
  server.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user
    
    const widgets = await prisma.widget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        enabled: true,
        allowedDomains: true,
        // Don't expose systemPrompt or API key in list view unless needed, typically fine though.
      }
    })

    return { widgets }
  })

  // Create a new widget
  server.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user
    
    const bodyResult = createWidgetSchema.safeParse(request.body)
    if (!bodyResult.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: bodyResult.error.format()
      })
    }
    
    const { name, systemPrompt, allowedDomains } = bodyResult.data

    // Generate a secure public API key
    const publicApiKey = `pk_live_${crypto.randomBytes(16).toString('hex')}`

    const widget = await prisma.widget.create({
      data: {
        userId: user.id,
        name,
        systemPrompt,
        allowedDomains,
        publicApiKey,
      }
    })

    return { widget }
  })

  // Get a specific widget
  server.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    // Check ownership
    await requireWidgetOwnership(request, reply, id)
    if (reply.sent) return

    const widget = (request as any).widget
    return { widget }
  })

  // Update a widget
  server.put('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    // Check ownership
    await requireWidgetOwnership(request, reply, id)
    if (reply.sent) return

    const bodyResult = updateWidgetSchema.safeParse(request.body)
    if (!bodyResult.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: bodyResult.error.format()
      })
    }

    const widget = await prisma.widget.update({
      where: { id },
      data: bodyResult.data
    })

    return { widget }
  })

  // Delete a widget
  server.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    // Check ownership
    await requireWidgetOwnership(request, reply, id)
    if (reply.sent) return

    await prisma.widget.delete({
      where: { id }
    })

    return { success: true }
  })

  // Regenerate API Key
  server.post('/:id/regenerate-key', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // Check ownership
    await requireWidgetOwnership(request, reply, id)
    if (reply.sent) return

    const newApiKey = `pk_live_${crypto.randomBytes(16).toString('hex')}`

    const widget = await prisma.widget.update({
      where: { id },
      data: { publicApiKey: newApiKey }
    })

    return { apiKey: widget.publicApiKey }
  })
}
