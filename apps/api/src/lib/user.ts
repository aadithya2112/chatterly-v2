import { createClerkClient } from '@clerk/backend'
import { prisma } from '@repo/db'

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

export interface AuthenticatedUser {
  id: string
  clerkUserId: string
  email: string
}

/**
 * Sync Clerk user to local database using lazy creation (upsert)
 */
export async function syncUserToDatabase(
  clerkUserId: string,
  email?: string,
): Promise<AuthenticatedUser> {
  try {
    // First try to get user by email if available
    let user = email
      ? await prisma.user.findUnique({
          where: { email },
        })
      : null

    // If not found by email, try by clerkUserId
    if (!user) {
      user = await prisma.user.findUnique({
        where: { clerkUserId },
      })
    }

    // If user exists, ensure clerkUserId matches
    if (user && user.clerkUserId !== clerkUserId) {
      // This shouldn't happen in normal flow, but handle it
      throw new Error('User email conflict detected')
    }

    // Create user if doesn't exist
    if (!user) {
      // Get user details from Clerk if email not provided
      if (!email) {
        const clerkUser = await clerkClient.users.getUser(clerkUserId)
        const primaryEmail = clerkUser.emailAddresses.find(
          (e: any) => e.id === clerkUser.primaryEmailAddressId,
        )
        email = primaryEmail?.emailAddress
        if (!email) {
          throw new Error('User email not found in Clerk')
        }
      }

      user = await prisma.user.create({
        data: {
          clerkUserId,
          email: email!,
        },
      })
    }

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
    }
  } catch (error: any) {
    console.error('Error syncing user to database:', error)
    throw new Error('Failed to sync user to database')
  }
}
