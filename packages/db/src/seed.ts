/**
 * Seeds the super admin account.
 *
 * Credentials created:
 *   Email:    superadmin@admin.com
 *   Password: Admin@1234
 *
 * Run: pnpm --filter @repo/db db:seed
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import * as schema from './schema'
import { eq } from 'drizzle-orm'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const EMAIL = 'superadmin@admin.com'
const PASSWORD = 'Admin@1234'
const USER_ID = 'seed-superadmin-001'

async function seed() {
    console.log('Seeding super admin...')

    // Check if already seeded
    const existing = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.email, EMAIL),
    })

    if (existing) {
        console.log('Super admin already exists. Skipping.')
        await client.end()
        return
    }

    // Use Better Auth's own hashPassword so the format matches what Better Auth
    // expects when verifying during sign-in (scrypt, not bcrypt).
    const hashedPassword = await hashPassword(PASSWORD)

    // 1 - User record
    await db.insert(schema.user).values({
        id: USER_ID,
        email: EMAIL,
        name: 'Super Admin',
        emailVerified: true,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    // 2 - Credential account (Better Auth reads account.password for sign-in)
    await db.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: USER_ID,
        providerId: 'credential',
        userId: USER_ID,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    // 3 - Admin access with full SUPER_ADMIN permissions
    await db.insert(schema.adminAccess).values({
        userId: USER_ID,
        adminRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        permissions: {
            users: ['read', 'write', 'delete', 'full'],
            analytics: ['read', 'write', 'full'],
            communications: ['read', 'write', 'delete', 'full'],
            admin_management: ['read', 'write', 'delete', 'full'],
            system: ['read', 'write', 'full'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    console.log('✓ Super admin seeded successfully')
    console.log(`  Email:    ${EMAIL}`)
    console.log(`  Password: ${PASSWORD}`)

    await client.end()
}

seed().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})
