// Server-side exports - only import in server components / server actions
export { auth } from './auth'
export type { Session, User } from './auth'

// Session helpers
export { getServerSession, requireServerSession } from './get-server-session'

// Email templates (server-side only)
export { welcomeEmail, passwordChangedEmail, resetPasswordEmail, verifyEmailTemplate } from './email-templates'

// Password hashing - use these instead of bcrypt so hashes match Better Auth's format
// Better Auth uses scrypt (node:crypto) not bcrypt
export { hashPassword, verifyPassword } from 'better-auth/crypto'

// Next.js route handler helper
export { toNextJsHandler } from 'better-auth/next-js'

// =========================================================
// IMPORTANT: Separate imports for different contexts
// =========================================================
// For MIDDLEWARE (Edge Runtime):
//   import { authMiddleware } from '@repo/auth/middleware'
//
// For CLIENT components ('use client'):
//   import { authClient, signIn, signOut, signUp, useSession } from '@repo/auth/client'
// =========================================================
