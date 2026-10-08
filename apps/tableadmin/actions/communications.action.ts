"use server"

import { db } from "@repo/db"
import { announcement, broadcast, adminAuditLog } from "@repo/db/schema"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { desc, eq } from "@repo/db"

interface Response<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

async function getAdminAccessRecord() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) return null
    return db.query.adminAccess.findFirst({
        where: (a, { eq }) => eq(a.userId, session.user.id),
    })
}

// Announcements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAnnouncements(): Promise<Response<any[]>> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        const items = await db.query.announcement.findMany({
            orderBy: [desc(announcement.createdAt)],
        })
        return { success: true, data: items }
    } catch (error) {
        console.error("Get announcements error:", error)
        return { success: false, error: "Failed to fetch announcements" }
    }
}

export async function createAnnouncement(input: {
    title: string
    content: string
    priority?: string
    status?: "DRAFT" | "PUBLISHED"
    expiresAt?: Date
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<Response<any>> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        const [item] = await db
            .insert(announcement)
            .values({
                title: input.title,
                content: input.content,
                priority: input.priority ?? "normal",
                status: input.status ?? "DRAFT",
                authorId: admin.id,
                publishedAt: input.status === "PUBLISHED" ? new Date() : null,
                expiresAt: input.expiresAt ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning()

        await db.insert(adminAuditLog).values({
            adminId: admin.id,
            action: "CREATE",
            module: "communications",
            resourceType: "Announcement",
            resourceId: item!.id,
            description: `Created announcement: ${input.title}`,
            createdAt: new Date(),
        })

        revalidatePath("/communications/announcements")
        return { success: true, data: item }
    } catch (error) {
        console.error("Create announcement error:", error)
        return { success: false, error: "Failed to create announcement" }
    }
}

export async function updateAnnouncementStatus(
    id: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<Response> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        await db
            .update(announcement)
            .set({
                status,
                publishedAt: status === "PUBLISHED" ? new Date() : undefined,
                updatedAt: new Date(),
            })
            .where(eq(announcement.id, id))

        revalidatePath("/communications/announcements")
        return { success: true }
    } catch (error) {
        console.error("Update announcement status error:", error)
        return { success: false, error: "Failed to update announcement" }
    }
}

export async function deleteAnnouncement(id: string): Promise<Response> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        await db.delete(announcement).where(eq(announcement.id, id))
        revalidatePath("/communications/announcements")
        return { success: true }
    } catch (error) {
        console.error("Delete announcement error:", error)
        return { success: false, error: "Failed to delete announcement" }
    }
}

// Broadcasts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getBroadcasts(): Promise<Response<any[]>> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        const items = await db.query.broadcast.findMany({
            orderBy: [desc(broadcast.createdAt)],
        })
        return { success: true, data: items }
    } catch (error) {
        console.error("Get broadcasts error:", error)
        return { success: false, error: "Failed to fetch broadcasts" }
    }
}

export async function createBroadcast(input: {
    subject: string
    content: string
    recipientType?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<Response<any>> {
    try {
        const admin = await getAdminAccessRecord()
        if (!admin) return { success: false, error: "Not authenticated" }

        const [item] = await db
            .insert(broadcast)
            .values({
                subject: input.subject,
                content: input.content,
                recipientType: input.recipientType ?? "all",
                status: "DRAFT",
                authorId: admin.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning()

        revalidatePath("/communications/broadcasts")
        return { success: true, data: item }
    } catch (error) {
        console.error("Create broadcast error:", error)
        return { success: false, error: "Failed to create broadcast" }
    }
}
