"use server"

import { db } from "@repo/db"
import { broadcast, adminAuditLog } from "@repo/db/schema"
import { eq, desc, count } from "@repo/db"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

export type BroadcastType = "info" | "warning" | "error" | "success"

export interface PlatformBroadcast {
    id: string
    subject: string
    content: string
    type: BroadcastType
    actionUrl: string | null
    actionLabel: string | null
    status: "DRAFT" | "SENT" | "SCHEDULED" | "FAILED"
    sentCount: number
    sentAt: Date | null
    metadata: Record<string, unknown> | null
    createdAt: Date
}

async function getAdminRecord() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) throw new Error("Unauthorized")
    const record = await db.query.adminAccess.findFirst({
        where: (a, { eq }) => eq(a.userId, session.user.id),
    })
    if (!record) throw new Error("Admin access required")
    return { record, userId: session.user.id, email: session.user.email }
}

export async function createBroadcast(data: {
    subject: string
    content: string
    type: BroadcastType
    actionUrl?: string
    actionLabel?: string
}): Promise<{ success: boolean; data?: PlatformBroadcast; error?: string }> {
    try {
        const { record } = await getAdminRecord()

        const [created] = await db.insert(broadcast).values({
            subject: data.subject,
            content: data.content,
            status: "DRAFT",
            recipientType: "all",
            recipientCount: 0,
            sentCount: 0,
            authorId: record.id,
            metadata: {
                type: data.type,
                actionUrl: data.actionUrl ?? null,
                actionLabel: data.actionLabel ?? null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning()

        await db.insert(adminAuditLog).values({
            adminId: record.id,
            action: "CREATE",
            module: "communications",
            resourceType: "Broadcast",
            resourceId: created?.id,
            description: `Created broadcast: ${data.subject}`,
            createdAt: new Date(),
        })

        revalidatePath("/communications/broadcasts")

        return {
            success: true,
            data: created ? rowTobroadcast(created) : undefined,
        }
    } catch (err) {
        console.error("createBroadcast error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Failed to create broadcast" }
    }
}

export async function updateBroadcast(
    id: string,
    data: {
        subject: string
        content: string
        type: BroadcastType
        actionUrl?: string
        actionLabel?: string
    },
): Promise<{ success: boolean; error?: string }> {
    try {
        const { record } = await getAdminRecord()
        await db.update(broadcast).set({
            subject: data.subject,
            content: data.content,
            metadata: {
                type: data.type,
                actionUrl: data.actionUrl ?? null,
                actionLabel: data.actionLabel ?? null,
            },
            updatedAt: new Date(),
        }).where(eq(broadcast.id, id))

        await db.insert(adminAuditLog).values({
            adminId: record.id,
            action: "UPDATE",
            module: "communications",
            resourceType: "Broadcast",
            resourceId: id,
            description: `Updated broadcast: ${data.subject}`,
            createdAt: new Date(),
        })

        revalidatePath("/communications/broadcasts")
        return { success: true }
    } catch (err) {
        console.error("updateBroadcast error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Failed to update" }
    }
}

export async function getBroadcasts(
    page = 1,
    limit = 50,
): Promise<{ broadcasts: PlatformBroadcast[]; total: number }> {
    await getAdminRecord()

    const skip = (page - 1) * limit
    const [rows, countResult] = await Promise.all([
        db.query.broadcast.findMany({
            orderBy: [desc(broadcast.createdAt)],
            offset: skip,
            limit,
        }),
        db.select({ total: count() }).from(broadcast),
    ])

    return {
        broadcasts: rows.map(rowTobroadcast),
        total: Number(countResult[0]?.total ?? 0),
    }
}

export async function deleteBroadcast(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { record } = await getAdminRecord()
        await db.delete(broadcast).where(eq(broadcast.id, id))

        await db.insert(adminAuditLog).values({
            adminId: record.id,
            action: "DELETE",
            module: "communications",
            resourceType: "Broadcast",
            resourceId: id,
            description: "Deleted broadcast",
            createdAt: new Date(),
        })

        revalidatePath("/communications/broadcasts")
        return { success: true }
    } catch (err) {
        console.error("deleteBroadcast error:", err)
        return { success: false, error: err instanceof Error ? err.message : "Failed to delete" }
    }
}

/**
 * Sends a test email to the current admin's address.
 * For production use, add `sendBroadcastToAllUsers()` targeting your user base.
 */
export async function sendTestBroadcastEmail(data: {
    subject: string
    content: string
    type: string
    actionUrl?: string
    actionLabel?: string
}): Promise<{ success: boolean; error?: string; sentTo?: string }> {
    try {
        const { email } = await getAdminRecord()
        if (!email) return { success: false, error: "No email found for your account" }

        const resendKey = process.env.RESEND_API_KEY
        if (!resendKey) return { success: false, error: "RESEND_API_KEY is not configured" }

        const { Resend } = await import("resend")
        const resend = new Resend(resendKey)

        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@yourapp.com",
            to: email,
            subject: `[TEST] ${data.subject}`,
            html: buildBroadcastEmailHtml({ ...data, isTest: true }),
        })

        return { success: true, sentTo: email }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to send test email" }
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowTobroadcast(row: typeof broadcast.$inferSelect): PlatformBroadcast {
    const meta = (row.metadata ?? {}) as Record<string, unknown>
    return {
        id: row.id,
        subject: row.subject,
        content: row.content,
        type: (meta.type as BroadcastType) ?? "info",
        actionUrl: (meta.actionUrl as string | null) ?? null,
        actionLabel: (meta.actionLabel as string | null) ?? null,
        status: row.status as "DRAFT" | "SENT" | "SCHEDULED" | "FAILED",
        sentCount: row.sentCount,
        sentAt: row.sentAt ?? null,
        metadata: meta,
        createdAt: row.createdAt,
    }
}

function buildBroadcastEmailHtml(params: {
    subject: string
    content: string
    actionUrl?: string
    actionLabel?: string
    isTest?: boolean
}): string {
    const year = new Date().getFullYear()
    const testBanner = params.isTest
        ? `<div style="margin:0 0 20px;padding:10px 14px;border:1px solid #fcd34d;border-radius:8px;background:#fffbeb;">
    <p style="margin:0;font-size:12px;font-weight:600;color:#92400e;">TEST EMAIL - This is a preview. Not sent to users.</p></div>`
        : ""
    const actionButton = params.actionUrl
        ? `<a href="${params.actionUrl}" style="display:inline-block;background:#171717;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">${params.actionLabel || "Learn More"} &rarr;</a>`
        : ""

    return `<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">
  <div style="background:#fff;border:1px solid #e5e5e5;border-radius:14px;overflow:hidden;">
    <div style="padding:24px 24px 14px;border-bottom:1px solid #efefef;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#111111;">
        <!-- Replace with your product name -->
        YourApp
      </p>
      <p style="margin:8px 0 0;font-size:14px;color:#525252;">Platform Broadcast</p>
    </div>
    <div style="padding:24px;">
      ${testBanner}
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111111;">${params.subject}</h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#404040;white-space:pre-wrap;">${params.content}</p>
      ${actionButton}
    </div>
  </div>
  <p style="margin:12px 2px 0;font-size:12px;color:#737373;">&copy; ${year} YourApp. All rights reserved.</p>
</div>
</body></html>`
}
