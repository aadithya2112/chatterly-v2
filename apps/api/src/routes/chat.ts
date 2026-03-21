import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@repo/db'
import { config } from '../config/env'
import { widgetRateLimitConfig } from '../config/rate-limit'

type NormalizedOrigin = {
  protocol: string
  host: string
  port: string
}

function toNormalizedOrigin(url: URL): NormalizedOrigin {
  const protocol = url.protocol.toLowerCase()
  const host = url.hostname.toLowerCase()
  const defaultPort = protocol === 'https:' ? '443' : protocol === 'http:' ? '80' : ''
  const port = url.port || defaultPort

  return { protocol, host, port }
}

function parseRequestOrigin(originHeader?: string, refererHeader?: string): NormalizedOrigin | null {
  const candidates = [originHeader, refererHeader].filter(
    (value): value is string => typeof value === 'string' && value.length > 0 && value !== 'null',
  )

  for (const value of candidates) {
    try {
      return toNormalizedOrigin(new URL(value))
    } catch {
      // Try next candidate
    }
  }

  return null
}

function parseAllowedDomain(value: string): NormalizedOrigin | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const maybeUrl = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return toNormalizedOrigin(new URL(maybeUrl))
  } catch {
    return null
  }
}

function isOriginAllowed(requestOrigin: NormalizedOrigin, allowedDomains: string[]): boolean {
  return allowedDomains.some((domain) => {
    const allowed = parseAllowedDomain(domain)
    if (!allowed) return false

    const hostMatches =
      requestOrigin.host === allowed.host || requestOrigin.host.endsWith(`.${allowed.host}`)

    return (
      requestOrigin.protocol === allowed.protocol &&
      requestOrigin.port === allowed.port &&
      hostMatches
    )
  })
}

export async function chatRoutes(server: FastifyInstance) {
  const chatSchema = z.object({
    message: z.string().min(1).max(2000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })).optional().default([])
  })

  server.post(
    '/',
    { config: { rateLimit: widgetRateLimitConfig } },
    async (request, reply) => {
    const apiKey = request.headers['x-widget-key'] as string
    const requestOrigin = parseRequestOrigin(
      request.headers.origin as string | undefined,
      request.headers.referer as string | undefined,
    )

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

    // Dev mode behavior: empty allowlist means allow all domains.
    if (widget.allowedDomains.length > 0) {
      if (!requestOrigin) {
        return reply.code(403).send({ error: 'Origin header required' })
      }

      const isAllowed = isOriginAllowed(requestOrigin, widget.allowedDomains)
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
    const systemPrompt = widget.systemPrompt || "You are a helpful assistant."
    if (!config.OPENROUTER_API_KEY) {
      return reply.code(503).send({ error: 'AI provider not configured' })
    }

    const modelResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      }),
    })

    if (!modelResponse.ok) {
      const upstreamError = await modelResponse.text()
      request.log.error(
        { status: modelResponse.status, upstreamError },
        'OpenRouter request failed',
      )
      return reply.code(502).send({ error: 'AI provider request failed' })
    }

    const modelData = await modelResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const aiContent = modelData.choices?.[0]?.message?.content?.trim()

    if (!aiContent) {
      return reply.code(502).send({ error: 'AI provider returned empty response' })
    }

    return {
      role: 'assistant',
      content: aiContent
    }
    },
  )
}
