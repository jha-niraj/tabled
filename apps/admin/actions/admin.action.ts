"use server"

import { db } from "@repo/db"
import {
    user,
    account,
    adminAccess,
    adminInvitation,
    adminAuditLog,
} from "@repo/db/schema"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { and, count, desc, eq, gte } from "@repo/db"
import { hashPassword, verifyPassword } from "@repo/auth"

// Types
export type AdminRole = "SUPER_ADMIN" | "TEAM_MEMBER"

interface CreateInvitationInput {
    email: string
    name?: string
    adminRole: AdminRole
    permissions?: Record<string, string[]>
}

interface AdminResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

function generateAccessCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = "ADMIN-"
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

async function getSession() {
    return auth.api.getSession({ headers: await headers() })
}

// Check if current user is admin
export async function checkAdminAccess(): Promise<AdminResponse<{ isAdmin: boolean; adminAccess: typeof adminAccess.$inferSelect }>> {
    try {
        const session = await getSession()

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminAccessRecord = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, session.user.id),
        })

        if (!adminAccessRecord || adminAccessRecord.status !== "ACTIVE") {
            return { success: false, error: "Not authorized" }
        }

        return {
            success: true,
            data: { isAdmin: true, adminAccess: adminAccessRecord },
        }
    } catch (error) {
        console.error("Admin access check error:", error)
        return { success: false, error: "Failed to check admin access" }
    }
}

// Get current admin info
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCurrentAdmin(): Promise<AdminResponse<any>> {
    try {
        const session = await getSession()

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const adminAccessRecord = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, session.user.id),
        })

        if (!adminAccessRecord) {
            return { success: false, error: "Not an admin" }
        }

        const userRecord = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, session.user.id),
            columns: { id: true, name: true, email: true, image: true },
        })

        return {
            success: true,
            data: {
                ...adminAccessRecord,
                role: adminAccessRecord.adminRole,
                name: userRecord?.name ?? null,
                email: userRecord?.email ?? '',
                image: userRecord?.image ?? null,
                user: userRecord,
            },
        }
    } catch (error) {
        console.error("Get current admin error:", error)
        return { success: false, error: "Failed to get admin info" }
    }
}

// Get all admin users
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminUsers(): Promise<AdminResponse<any[]>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const admins = await db.query.adminAccess.findMany({
            with: {
                invitations: {
                    limit: 5,
                    orderBy: (inv, { desc }) => [desc(inv.createdAt)],
                },
            },
            orderBy: [desc(adminAccess.createdAt)],
        })

        const adminWithUsers = await Promise.all(
            admins.map(async (admin) => {
                const userRecord = await db.query.user.findFirst({
                    where: (u, { eq }) => eq(u.id, admin.userId),
                    columns: { id: true, name: true, email: true, image: true },
                })
                return {
                    ...admin,
                    role: admin.adminRole,
                    name: userRecord?.name ?? null,
                    email: userRecord?.email ?? '',
                    image: userRecord?.image ?? null,
                    user: userRecord,
                }
            }),
        )

        return { success: true, data: adminWithUsers }
    } catch (error) {
        console.error("Get admin users error:", error)
        return { success: false, error: "Failed to fetch admin users" }
    }
}

// Create admin invitation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createAdminInvitation(input: CreateInvitationInput): Promise<AdminResponse<any>> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccessRecord = accessCheck.data?.adminAccess

        if (adminAccessRecord?.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can create invitations" }
        }

        // Check if email already has admin access
        const existingUser = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.email, input.email),
        })

        if (existingUser) {
            const existingAdmin = await db.query.adminAccess.findFirst({
                where: (a, { eq }) => eq(a.userId, existingUser.id),
            })
            if (existingAdmin) {
                return { success: false, error: "User already has admin access" }
            }
        }

        // Check for existing pending invitation
        const existingInvite = await db.query.adminInvitation.findFirst({
            where: (inv, { and, eq }) =>
                and(eq(inv.email, input.email), eq(inv.status, "PENDING")),
        })

        if (existingInvite) {
            return { success: false, error: "Pending invitation already exists for this email" }
        }

        const [invitation] = await db
            .insert(adminInvitation)
            .values({
                email: input.email,
                name: input.name,
                code: generateAccessCode(),
                adminRole: input.adminRole,
                permissions: input.permissions ?? {},
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdById: adminAccessRecord!.id,
                createdAt: new Date(),
            })
            .returning()

        await db.insert(adminAuditLog).values({
            adminId: adminAccessRecord!.id,
            action: "CREATE",
            module: "admin_management",
            resourceType: "AdminInvitation",
            resourceId: invitation!.id,
            description: `Created invitation for ${input.email} with role ${input.adminRole}`,
            createdAt: new Date(),
        })

        // Send invitation email with join link
        const joinUrl = `${process.env.ADMIN_APP_URL || 'http://localhost:3001'}/join?token=${invitation!.code}`
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
            const { Resend } = await import('resend')
            const resend = new Resend(resendKey)
            await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'noreply@yourapp.com',
                to: input.email,
                subject: "You've been invited to join the admin panel",
                html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#171717;border-radius:16px;border:1px solid #262626;overflow:hidden;">
<tr><td style="padding:32px 40px 24px;border-bottom:1px solid #262626;">
<span style="font-size:16px;font-weight:600;color:#fff;">Admin Panel</span>
</td></tr>
<tr><td style="padding:32px 40px;">
<h1 style="margin:0 0 12px;font-size:24px;font-weight:600;color:#fff;">You're invited!</h1>
<p style="margin:0 0 8px;font-size:15px;color:#a3a3a3;line-height:1.6;">You've been invited to join as <strong style="color:#f87171;">${input.adminRole.replace('_', ' ')}</strong>.</p>
<p style="margin:0 0 32px;font-size:15px;color:#a3a3a3;line-height:1.6;">Click the button below to accept and set your password. This link expires in 7 days.</p>
<a href="${joinUrl}" style="display:inline-block;background:linear-gradient(to right,#ef4444,#f97316);color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">Accept Invitation</a>
<p style="margin:32px 0 0;font-size:13px;color:#525252;">Or copy this link:<br/><a href="${joinUrl}" style="color:#f87171;word-break:break-all;">${joinUrl}</a></p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #262626;">
<p style="margin:0;font-size:12px;color:#525252;">If you didn't expect this invitation, you can safely ignore it.</p>
</td></tr>
</table></td></tr></table></body></html>`,
            }).catch(console.error)
        }

        revalidatePath("/admins")
        revalidatePath("/admins/invitations")

        return { success: true, data: { ...invitation, joinUrl } }
    } catch (error) {
        console.error("Create invitation error:", error)
        return { success: false, error: "Failed to create invitation" }
    }
}

// Verify access code and create admin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyAccessCode(email: string, accessCode: string): Promise<AdminResponse<any>> {
    try {
        const normalizedEmail = email.toLowerCase()
        const normalizedCode = accessCode.toUpperCase()

        const invitation = await db.query.adminInvitation.findFirst({
            where: (inv, { and, eq }) =>
                and(
                    eq(inv.email, normalizedEmail),
                    eq(inv.code, normalizedCode),
                    eq(inv.status, "PENDING"),
                ),
        })

        if (!invitation) {
            return { success: false, error: "Invalid access code" }
        }

        if (new Date() > invitation.expiresAt) {
            await db
                .update(adminInvitation)
                .set({ status: "EXPIRED" })
                .where(eq(adminInvitation.id, invitation.id))
            return { success: false, error: "Access code has expired" }
        }

        const hashedPassword = await hashPassword(normalizedCode)

        let existingUser = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.email, normalizedEmail),
        })

        if (!existingUser) {
            const [newUser] = await db
                .insert(user)
                .values({
                    id: crypto.randomUUID(),
                    email: normalizedEmail,
                    name: invitation.name || normalizedEmail.split("@")[0]!,
                    emailVerified: true,
                    role: "ADMIN",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning()

            existingUser = newUser!

            await db.insert(account).values({
                id: crypto.randomUUID(),
                accountId: existingUser.id,
                providerId: "credential",
                userId: existingUser.id,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }

        let adminAccessRecord = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, existingUser!.id),
        })

        if (!adminAccessRecord) {
            const [newAccess] = await db
                .insert(adminAccess)
                .values({
                    userId: existingUser.id,
                    adminRole: invitation.adminRole,
                    permissions: invitation.permissions ?? {},
                    status: "ACTIVE",
                    inviteCode: normalizedCode,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning()

            adminAccessRecord = newAccess!
        }

        await db
            .update(adminInvitation)
            .set({ status: "USED", usedBy: existingUser.id, usedAt: new Date() })
            .where(eq(adminInvitation.id, invitation.id))

        await db.insert(adminAuditLog).values({
            adminId: adminAccessRecord.id,
            action: "LOGIN",
            module: "admin_management",
            resourceType: "AdminAccess",
            resourceId: adminAccessRecord.id,
            description: `New admin ${email} activated via access code`,
            createdAt: new Date(),
        })

        return {
            success: true,
            data: { user: existingUser, adminAccess: adminAccessRecord, needsPasswordSetup: true },
        }
    } catch (error) {
        console.error("Verify access code error:", error)
        return { success: false, error: "Failed to verify access code" }
    }
}

// Get pending invitations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPendingInvitations(): Promise<AdminResponse<any[]>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const invitations = await db.query.adminInvitation.findMany({
            where: (inv, { eq }) => eq(inv.status, "PENDING"),
            orderBy: [desc(adminInvitation.createdAt)],
        })

        return { success: true, data: invitations }
    } catch (error) {
        console.error("Get invitations error:", error)
        return { success: false, error: "Failed to fetch invitations" }
    }
}

// Revoke invitation
export async function revokeInvitation(invitationId: string): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccessRecord = accessCheck.data?.adminAccess

        if (adminAccessRecord?.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can revoke invitations" }
        }

        await db
            .update(adminInvitation)
            .set({ status: "REVOKED" })
            .where(eq(adminInvitation.id, invitationId))

        await db.insert(adminAuditLog).values({
            adminId: adminAccessRecord.id,
            action: "DELETE",
            module: "admin_management",
            resourceType: "AdminInvitation",
            resourceId: invitationId,
            description: "Revoked admin invitation",
            createdAt: new Date(),
        })

        revalidatePath("/admins/invitations")

        return { success: true }
    } catch (error) {
        console.error("Revoke invitation error:", error)
        return { success: false, error: "Failed to revoke invitation" }
    }
}

// Update admin status
export async function updateAdminStatus(
    adminId: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccessRecord = accessCheck.data?.adminAccess

        if (adminAccessRecord?.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update admin status" }
        }

        await db
            .update(adminAccess)
            .set({ status, updatedAt: new Date() })
            .where(eq(adminAccess.id, adminId))

        await db.insert(adminAuditLog).values({
            adminId: adminAccessRecord.id,
            action: "UPDATE",
            module: "admin_management",
            resourceType: "AdminAccess",
            resourceId: adminId,
            description: `Updated admin status to ${status}`,
            createdAt: new Date(),
        })

        revalidatePath("/admins")

        return { success: true }
    } catch (error) {
        console.error("Update admin status error:", error)
        return { success: false, error: "Failed to update admin status" }
    }
}

// Update admin permissions
export async function updateAdminPermissions(
    adminId: string,
    permissions: Record<string, string[]>,
): Promise<AdminResponse> {
    try {
        const accessCheck = await checkAdminAccess()
        if (!accessCheck.success) return { success: false, error: accessCheck.error }

        const adminAccessRecord = accessCheck.data?.adminAccess

        if (adminAccessRecord?.adminRole !== "SUPER_ADMIN") {
            return { success: false, error: "Only super admins can update permissions" }
        }

        const previousAdmin = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.id, adminId),
        })

        await db
            .update(adminAccess)
            .set({ permissions, updatedAt: new Date() })
            .where(eq(adminAccess.id, adminId))

        await db.insert(adminAuditLog).values({
            adminId: adminAccessRecord.id,
            action: "UPDATE",
            module: "admin_management",
            resourceType: "AdminAccess",
            resourceId: adminId,
            description: "Updated admin permissions",
            changes: { before: previousAdmin?.permissions, after: permissions },
            createdAt: new Date(),
        })

        revalidatePath("/admins")

        return { success: true }
    } catch (error) {
        console.error("Update admin permissions error:", error)
        return { success: false, error: "Failed to update permissions" }
    }
}

// Get dashboard stats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDashboardStats(): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)

        const [[totalUsersResult], [newUsersResult], [totalAdminsResult], [activeTodayResult]] =
            await Promise.all([
                db.select({ count: count() }).from(user),
                db.select({ count: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
                db.select({ count: count() }).from(adminAccess).where(eq(adminAccess.status, "ACTIVE")),
                db.select({ count: count() }).from(user).where(gte(user.createdAt, today)),
            ])

        return {
            success: true,
            data: {
                totalUsers: totalUsersResult?.count ?? 0,
                newUsersThisMonth: newUsersResult?.count ?? 0,
                activeToday: activeTodayResult?.count ?? 0,
                totalAdmins: totalAdminsResult?.count ?? 0,
                totalCredits: 0,
                growthRate:
                    (totalUsersResult?.count ?? 0) > 0
                        ? Math.round(((newUsersResult?.count ?? 0) / (totalUsersResult?.count ?? 1)) * 100)
                        : 0,
            },
        }
    } catch (error) {
        console.error("Get dashboard stats error:", error)
        return { success: false, error: "Failed to fetch dashboard stats" }
    }
}

// Get audit logs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAuditLogs(page = 1, limit = 20): Promise<AdminResponse<any>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const [logs, [totalResult]] = await Promise.all([
            db.query.adminAuditLog.findMany({
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(adminAuditLog.createdAt)],
                with: { admin: { columns: { userId: true } } },
            }),
            db.select({ count: count() }).from(adminAuditLog),
        ])

        const total = totalResult?.count ?? 0

        const logsWithUser = await Promise.all(
            logs.map(async (log) => {
                const userRecord = await db.query.user.findFirst({
                    where: (u, { eq }) => eq(u.id, log.admin.userId),
                    columns: { name: true, email: true, image: true },
                })
                return { ...log, adminUser: userRecord }
            }),
        )

        return {
            success: true,
            data: {
                logs: logsWithUser,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
            },
        }
    } catch (error) {
        console.error("Get audit logs error:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}

// Set admin password (after initial access code login)
export async function setAdminPassword(newPassword: string): Promise<AdminResponse> {
    try {
        const session = await getSession()

        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const hashedPassword = await hashPassword(newPassword)

        // Update in the Better Auth account table
        await db
            .update(account)
            .set({ password: hashedPassword, updatedAt: new Date() })
            .where(
                and(eq(account.userId, session.user.id), eq(account.providerId, "credential")),
            )

        // Clear the temporary access code from adminAccess
        await db
            .update(adminAccess)
            .set({ accessCode: null, accessCodeExpiry: null, hashedPassword, updatedAt: new Date() })
            .where(eq(adminAccess.userId, session.user.id))

        return { success: true }
    } catch (error) {
        console.error("Set admin password error:", error)
        return { success: false, error: "Failed to set password" }
    }
}

// Change password with current password verification
export async function changeAdminPassword(
    currentPassword: string,
    newPassword: string,
): Promise<AdminResponse> {
    try {
        const session = await getSession()
        if (!session?.user?.id) {
            return { success: false, error: "Not authenticated" }
        }

        const credentialAccount = await db.query.account.findFirst({
            where: (a, { and, eq }) =>
                and(eq(a.userId, session.user.id), eq(a.providerId, "credential")),
        })

        if (!credentialAccount?.password) {
            return { success: false, error: "No password set for this account" }
        }

        const valid = await verifyPassword({ hash: credentialAccount.password, password: currentPassword })
        if (!valid) {
            return { success: false, error: "Current password is incorrect" }
        }

        const hashedNew = await hashPassword(newPassword)

        await db
            .update(account)
            .set({ password: hashedNew, updatedAt: new Date() })
            .where(eq(account.id, credentialAccount.id))

        const adminAccessRecord = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, session.user.id),
        })

        if (adminAccessRecord) {
            await db.insert(adminAuditLog).values({
                adminId: adminAccessRecord.id,
                action: "UPDATE",
                module: "admin_management",
                resourceType: "User",
                resourceId: session.user.id,
                description: "Changed password",
                createdAt: new Date(),
            })
        }

        return { success: true }
    } catch (error) {
        console.error("Change password error:", error)
        return { success: false, error: "Failed to change password" }
    }
}

// Look up a pending invitation by token (for the join page)
export async function getInvitationByToken(token: string): Promise<AdminResponse<{
    email: string
    adminRole: string
    name: string | null
}>> {
    try {
        const invitation = await db.query.adminInvitation.findFirst({
            where: (inv, { and, eq }) =>
                and(eq(inv.code, token.toUpperCase()), eq(inv.status, "PENDING")),
        })

        if (!invitation) return { success: false, error: "Invalid or already used invitation link" }

        if (new Date() > invitation.expiresAt) {
            await db
                .update(adminInvitation)
                .set({ status: "EXPIRED" })
                .where(eq(adminInvitation.id, invitation.id))
            return { success: false, error: "This invitation has expired" }
        }

        return {
            success: true,
            data: {
                email: invitation.email,
                adminRole: invitation.adminRole,
                name: invitation.name ?? null,
            },
        }
    } catch (error) {
        console.error("Get invitation by token error:", error)
        return { success: false, error: "Failed to verify invitation" }
    }
}

// Accept an invitation - creates user + admin access with chosen password
export async function joinAdminInvitation(
    token: string,
    password: string,
): Promise<AdminResponse<{ email: string }>> {
    try {
        const normalizedCode = token.toUpperCase()

        const invitation = await db.query.adminInvitation.findFirst({
            where: (inv, { and, eq }) =>
                and(eq(inv.code, normalizedCode), eq(inv.status, "PENDING")),
        })

        if (!invitation) return { success: false, error: "Invalid or already used invitation link" }

        if (new Date() > invitation.expiresAt) {
            await db
                .update(adminInvitation)
                .set({ status: "EXPIRED" })
                .where(eq(adminInvitation.id, invitation.id))
            return { success: false, error: "This invitation has expired" }
        }

        const hashedPassword = await hashPassword(password)
        const normalizedEmail = invitation.email.toLowerCase()

        // Create or reuse user
        let existingUser = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.email, normalizedEmail),
        })

        if (!existingUser) {
            const [newUser] = await db
                .insert(user)
                .values({
                    id: crypto.randomUUID(),
                    email: normalizedEmail,
                    name: invitation.name || normalizedEmail.split("@")[0]!,
                    emailVerified: true,
                    role: "ADMIN",
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning()
            existingUser = newUser!
        }

        // Create credential account (skip if already exists)
        const existingAccount = await db.query.account.findFirst({
            where: (a, { and, eq }) =>
                and(eq(a.userId, existingUser!.id), eq(a.providerId, "credential")),
        })

        if (!existingAccount) {
            await db.insert(account).values({
                id: crypto.randomUUID(),
                accountId: existingUser.id,
                providerId: "credential",
                userId: existingUser.id,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }

        // Create adminAccess (skip if already exists)
        const existingAccess = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, existingUser!.id),
        })

        let adminAccessRecord = existingAccess

        if (!existingAccess) {
            const [newAccess] = await db
                .insert(adminAccess)
                .values({
                    userId: existingUser.id,
                    adminRole: invitation.adminRole,
                    status: "ACTIVE",
                    permissions: invitation.permissions ?? {},
                    inviteCode: normalizedCode,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning()
            adminAccessRecord = newAccess!
        }

        // Mark invitation used
        await db
            .update(adminInvitation)
            .set({ status: "USED", usedBy: existingUser.id, usedAt: new Date() })
            .where(eq(adminInvitation.id, invitation.id))

        // Audit log
        if (adminAccessRecord) {
            await db.insert(adminAuditLog).values({
                adminId: adminAccessRecord.id,
                action: "LOGIN",
                module: "admin_management",
                resourceType: "AdminAccess",
                resourceId: adminAccessRecord.id,
                description: `${normalizedEmail} joined via invitation link`,
                createdAt: new Date(),
            })
        }

        return { success: true, data: { email: normalizedEmail } }
    } catch (error) {
        console.error("Join admin invitation error:", error)
        return { success: false, error: "Failed to process invitation" }
    }
}

// ─── Types for audit log with admin info ─────────────────────────────────────

export interface AuditLogWithAdmin {
    id: string
    action: string
    module: string
    resourceType: string | null
    resourceId: string | null
    description: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any> | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changes: Record<string, any> | null
    ipAddress: string | null
    createdAt: Date | string
    adminRole?: string
    adminUser?: { name: string | null; email: string | null } | null
}

export interface AdminListItem {
    id: string
    name: string | null
    email: string | null
}

// Get audit logs with filters (date range, module, adminId)
export async function getAuditLogsFiltered(params: {
    from?: Date
    to?: Date
    limit?: number
    module?: string
    adminId?: string
}): Promise<AdminResponse<{ logs: AuditLogWithAdmin[]; total: number }>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const conditions = []
        if (params.from) conditions.push(gte(adminAuditLog.createdAt, params.from))
        if (params.module) conditions.push(eq(adminAuditLog.module, params.module))
        if (params.adminId) conditions.push(eq(adminAuditLog.adminId, params.adminId))

        const where = conditions.length > 0 ? and(...conditions) : undefined
        const limit = params.limit ?? 100

        const [rawLogs, [totalResult]] = await Promise.all([
            db.query.adminAuditLog.findMany({
                limit,
                where,
                orderBy: [desc(adminAuditLog.createdAt)],
                with: { admin: { columns: { userId: true, adminRole: true } } },
            }),
            db.select({ count: count() }).from(adminAuditLog).where(where),
        ])

        const logs: AuditLogWithAdmin[] = await Promise.all(
            rawLogs.map(async (log) => {
                const adminUser = await db.query.user.findFirst({
                    where: (u, { eq }) => eq(u.id, log.admin.userId),
                    columns: { name: true, email: true },
                })
                return {
                    ...log,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    metadata: log.metadata as Record<string, any> | null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    changes: log.changes as Record<string, any> | null,
                    adminRole: log.admin.adminRole,
                    adminUser: adminUser ?? null,
                }
            }),
        )

        return {
            success: true,
            data: { logs, total: totalResult?.count ?? 0 },
        }
    } catch (error) {
        console.error("Get filtered audit logs error:", error)
        return { success: false, error: "Failed to fetch audit logs" }
    }
}

// Get admin list for filter dropdown
export async function getAdminList(): Promise<AdminResponse<AdminListItem[]>> {
    try {
        const { success, error } = await checkAdminAccess()
        if (!success) return { success: false, error }

        const records = await db.query.adminAccess.findMany({
            with: { user: { columns: { id: true, name: true, email: true } } },
        })

        return {
            success: true,
            data: records.map((r) => ({
                id: r.id,
                name: r.user?.name ?? null,
                email: r.user?.email ?? null,
            })),
        }
    } catch (error) {
        console.error("Get admin list error:", error)
        return { success: false, error: "Failed to fetch admin list" }
    }
}

// Update admin profile avatar
export async function updateAdminAvatar(imageUrl: string): Promise<AdminResponse> {
    try {
        const session = await getSession()
        if (!session?.user?.id) return { success: false, error: "Not authenticated" }

        if (!imageUrl.startsWith("https://")) return { success: false, error: "Invalid image URL" }

        await db.update(user).set({ image: imageUrl, updatedAt: new Date() }).where(eq(user.id, session.user.id))
        return { success: true }
    } catch (error) {
        console.error("Update admin avatar error:", error)
        return { success: false, error: "Failed to update avatar" }
    }
}

// Mark last login time for the current admin session
export async function updateLastLogin(): Promise<void> {
    try {
        const session = await getSession()
        if (!session?.user?.id) return

        await db
            .update(adminAccess)
            .set({ lastLoginAt: new Date(), updatedAt: new Date() })
            .where(eq(adminAccess.userId, session.user.id))
    } catch {
        // Silent — non-critical
    }
}
