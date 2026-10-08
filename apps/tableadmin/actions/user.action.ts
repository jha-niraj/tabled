"use server"

import { db } from "@repo/db"
import { user } from "@repo/db/schema"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { eq, desc, count, ilike, or, and } from "@repo/db"

interface Response<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) return null
    return db.query.adminAccess.findFirst({
        where: (a, { eq }) => eq(a.userId, session.user.id),
    })
}

export async function getUsers(
    page = 1,
    limit = 20,
    search = "",
    status?: "active" | "inactive",
): Promise<Response<{ items: typeof user.$inferSelect[]; total: number; pages: number }>> {
    try {
        const admin = await requireAdmin()
        if (!admin) return { success: false, error: "Not authenticated" }

        const filters = []
        if (search.trim()) {
            filters.push(
                or(
                    ilike(user.email, `%${search}%`),
                    ilike(user.name, `%${search}%`),
                ),
            )
        }
        if (status === "active") filters.push(eq(user.isActive, true))
        if (status === "inactive") filters.push(eq(user.isActive, false))

        const where = filters.length > 0 ? and(...filters) : undefined

        const [items, [totalResult]] = await Promise.all([
            db.query.user.findMany({
                where,
                orderBy: [desc(user.createdAt)],
                limit,
                offset: (page - 1) * limit,
            }),
            db.select({ count: count() }).from(user).where(where),
        ])

        const total = totalResult?.count ?? 0
        return { success: true, data: { items, total, pages: Math.ceil(total / limit) } }
    } catch (error) {
        console.error("Get users error:", error)
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function getUserById(
    userId: string,
): Promise<Response<typeof user.$inferSelect & { adminAccess: unknown }>> {
    try {
        const admin = await requireAdmin()
        if (!admin) return { success: false, error: "Not authenticated" }

        const record = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            with: { adminAccess: true },
        })

        if (!record) return { success: false, error: "User not found" }
        return { success: true, data: record as typeof user.$inferSelect & { adminAccess: unknown } }
    } catch (error) {
        console.error("Get user by id error:", error)
        return { success: false, error: "Failed to fetch user" }
    }
}

export async function updateUserStatus(
    userId: string,
    isActive: boolean,
): Promise<Response> {
    try {
        const admin = await requireAdmin()
        if (!admin) return { success: false, error: "Not authenticated" }
        if (admin.adminRole !== "SUPER_ADMIN") return { success: false, error: "Super admin only" }

        await db.update(user).set({ isActive, updatedAt: new Date() }).where(eq(user.id, userId))

        revalidatePath("/users")
        revalidatePath(`/users/${userId}`)
        return { success: true }
    } catch (error) {
        console.error("Update user status error:", error)
        return { success: false, error: "Failed to update user status" }
    }
}
