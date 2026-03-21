import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '@clerk/backend'
import { prisma } from '@repo/db'
import { syncUserToDatabase } from '../lib/user'
import { clerkAuthorizedParties } from '../config/env'

export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      })
    }

    const token = authHeader.slice(7).trim()
    
    // Verify the Clerk JWT
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: clerkAuthorizedParties,
    })

    if (!payload.sub) {
      return reply.code(401).send({
        error: 'Invalid token - no subject',
        code: 'INVALID_TOKEN'
      })
    }

    // Sync user to database (lazy creation)
    const sub = payload.sub
    const email = payload.email as string | undefined
    
    if (!sub) {
      return reply.code(401).send({
        error: 'Invalid token - no subject',
        code: 'INVALID_TOKEN'
      })
    }

    const authenticatedUser = await syncUserToDatabase(sub, email);
    
    // Attach user to request object
    (request as any).user = authenticatedUser
  } catch (error: any) {
    request.log.error({ 
      message: error.message, 
      name: error.name,
      stack: error.stack 
    }, 'Authentication error details')
    
    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      })
    }
    
    return reply.code(401).send({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    })
  }
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  await authenticateToken(request, reply)
}

export async function requireWidgetOwnership(
  request: FastifyRequest,
  reply: FastifyReply,
  widgetId: string,
) {
  const user = (request as any).user
  
  if (!user) {
    return reply.code(401).send({
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    })
  }

  const widget = await prisma.widget.findFirst({
    where: {
      id: widgetId,
      userId: user.id,
    },
  })

  if (!widget) {
    return reply.code(404).send({
      error: 'Widget not found or access denied',
      code: 'WIDGET_NOT_FOUND'
    })
  }

  // Attach widget to request for later use
  ;(request as any).widget = widget
}
