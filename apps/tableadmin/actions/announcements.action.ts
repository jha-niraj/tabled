"use server"

import { db } from "@repo/db"
import { announcement, adminAuditLog } from "@repo/db/schema"
import { eq, desc, count } from "@repo/db"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export type AnnouncementType = "MAINTENANCE" | "FEATURE_RELEASE" | "POLICY_CHANGE" | "PLATFORM_NEWS"
export type AnnouncementPriority = "NORMAL" | "HIGH" | "URGENT"

export interface PlatformAnnouncement {
    id: string
    title: string
    content: string
    announcementType: AnnouncementType
    priority: AnnouncementPriority
    /** Generic audience note - replace with product-specific targeting (e.g., user segments) */
    targetAudience: string | null
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    createdAt: Date
}

async function getAdminRecord() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) throw new Error("Unauthorized")
    const record = await db.query.adminAccess.findFirst({
        where: (a, { eq }) => eq(a.userId, session.user.id),
    })
    if (!record) throw new Error("Admin access required")
    return record
}

export async function createPlatformAnnouncement(data: {
    title: string
    content: string
    announcementType: AnnouncementType
    priority: AnnouncementPriority
    targetAudience?: string | null
}): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await getAdminRecord()

        const [created] = await db.insert(announcement).values({
            title: data.title,
            content: data.content,
            status: "PUBLISHED",
            priority: data.priority,
            authorId: admin.id,
            publishedAt: new Date(),
            metadata: {
                announcementType: data.announcementType,
                targetAudience: data.targetAudience ?? null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning()

        await db.insert(adminAuditLog).values({
            adminId: admin.id,
            action: "CREATE",
            module: "communications",
            resourceType: "Announcement",
            resourceId: created?.id,
            description: `Created platform announcement: ${data.title}`,
            createdAt: new Date(),
        })

        revalidatePath("/communications/announcements")
        return { success: true }
    } catch (err) {
        console.error("createPlatformAnnouncement error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Failed to create announcement" }
    }
}

export async function getPlatformAnnouncements(
    page = 1,
    limit = 20,
): Promise<{ announcements: PlatformAnnouncement[]; total: number; totalPages: number }> {
    await getAdminRecord()

    const skip = (page - 1) * limit
    const [rows, countResult] = await Promise.all([
        db.query.announcement.findMany({
            orderBy: [desc(announcement.createdAt)],
            offset: skip,
            limit,
        }),
        db.select({ total: count() }).from(announcement),
    ])

    const total = Number(countResult[0]?.total ?? 0)
    const announcements: PlatformAnnouncement[] = rows.map((row) => {
        const meta = (row.metadata ?? {}) as Record<string, unknown>
        return {
            id: row.id,
            title: row.title,
            content: row.content,
            announcementType: (meta.announcementType as AnnouncementType) ?? "PLATFORM_NEWS",
            priority: (row.priority as AnnouncementPriority) ?? "NORMAL",
            targetAudience: (meta.targetAudience as string | null) ?? null,
            status: row.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            createdAt: row.createdAt,
        }
    })

    return { announcements, total, totalPages: Math.ceil(total / limit) }
}

export async function deletePlatformAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await getAdminRecord()

        await db.delete(announcement).where(eq(announcement.id, id))

        await db.insert(adminAuditLog).values({
            adminId: admin.id,
            action: "DELETE",
            module: "communications",
            resourceType: "Announcement",
            resourceId: id,
            description: "Deleted platform announcement",
            createdAt: new Date(),
        })

        revalidatePath("/communications/announcements")
        return { success: true }
    } catch (err) {
        console.error("deletePlatformAnnouncement error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Failed to delete" }
    }
}
