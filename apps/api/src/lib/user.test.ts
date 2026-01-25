import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { syncUserToDatabase } from './user'
import { prisma } from '@repo/db'

// Mock Prisma
mock.module('@repo/db', () => ({
  prisma: {
    user: {
      findUnique: mock(),
      create: mock(),
    },
  },
}))

// Mock Clerk Backend
mock.module('@clerk/backend', () => ({
  createClerkClient: () => ({
    users: {
      getUser: mock(),
    },
  }),
  verifyToken: mock(),
}))

describe('syncUserToDatabase', () => {
  beforeEach(() => {
    // Reset mocks before each test (if supported by Bun mock, otherwise handled by return values)
    // In Bun, we often just redefine or ignore call history if strictly needed,
    // but here we'll just rely on setting new implementations.
  })

  it('should return existing user if found by email', async () => {
    // Setup
    const mockUser = { id: 'u1', clerkUserId: 'c1', email: 'test@example.com' }
    ;(prisma.user.findUnique as any).mockResolvedValue(mockUser)

    // Execute
    const result = await syncUserToDatabase('c1', 'test@example.com')

    // Assert
    expect(result).toEqual(mockUser)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
  })

  it('should return existing user if found by clerkUserId', async () => {
    // Setup
    // First call (by email) returns null
    ;(prisma.user.findUnique as any)
      .mockResolvedValueOnce(null)
      // Second call (by clerkId) returns user
      .mockResolvedValueOnce({ id: 'u1', clerkUserId: 'c1', email: 'test@example.com' })

    // Execute
    const result = await syncUserToDatabase('c1', 'test@example.com')

    // Assert
    expect(result).toEqual({ id: 'u1', clerkUserId: 'c1', email: 'test@example.com' })
  })

  it('should create new user if not found', async () => {
    // Setup
    // Both findUnique calls return null
    ;(prisma.user.findUnique as any).mockResolvedValue(null)
    
    const newUser = { id: 'new_id', clerkUserId: 'c2', email: 'new@example.com' }
    ;(prisma.user.create as any).mockResolvedValue(newUser)

    // Execute
    const result = await syncUserToDatabase('c2', 'new@example.com')

    // Assert
    expect(result).toEqual(newUser)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { clerkUserId: 'c2', email: 'new@example.com' },
    })
  })
})
