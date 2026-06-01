"use server"

import { getServerSession } from '@repo/auth'
import { db } from '@repo/db'
import { notification } from '@repo/db/schema'
import { eq, desc, and, count } from '@repo/db'
import { revalidatePath } from 'next/cache'

type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface CreateNotificationInput {
    userId: string
    title: string
    message: string
    type?: NotificationType
    actionUrl?: string
    actionLabel?: string
    metadata?: Record<string, unknown>
}

interface NotificationResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

export async function getNotifications(page = 1, limit = 20): Promise<NotificationResponse<{ items: typeof notification.$inferSelect[]; total: number; unread: number }>> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const [items, [totalResult], [unreadResult]] = await Promise.all([
        db.query.notification.findMany({
            where: (n, { eq }) => eq(n.userId, session.user.id),
            orderBy: [desc(notification.createdAt)],
            limit,
            offset: (page - 1) * limit,
        }),
        db.select({ count: count() }).from(notification).where(eq(notification.userId, session.user.id)),
        db.select({ count: count() }).from(notification).where(
            and(eq(notification.userId, session.user.id), eq(notification.isRead, false)),
        ),
    ])

    return {
        success: true,
        data: {
            items,
            total: totalResult?.count ?? 0,
            unread: unreadResult?.count ?? 0,
        },
    }
}

export async function getUnreadCount(): Promise<NotificationResponse<number>> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const [result] = await db
        .select({ count: count() })
        .from(notification)
        .where(and(eq(notification.userId, session.user.id), eq(notification.isRead, false)))

    return { success: true, data: result?.count ?? 0 }
}

export async function markAsRead(notificationId: string): Promise<NotificationResponse> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await db
        .update(notification)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notification.id, notificationId), eq(notification.userId, session.user.id)))

    revalidatePath('/home')
    return { success: true }
}

export async function markAllAsRead(): Promise<NotificationResponse> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await db
        .update(notification)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notification.userId, session.user.id), eq(notification.isRead, false)))

    revalidatePath('/home')
    return { success: true }
}

export async function deleteNotification(notificationId: string): Promise<NotificationResponse> {
    const session = await getServerSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await db
        .delete(notification)
        .where(and(eq(notification.id, notificationId), eq(notification.userId, session.user.id)))

    revalidatePath('/home')
    return { success: true }
}

// Internal: create a notification for a user (call from other server actions)
export async function createNotification(input: CreateNotificationInput): Promise<NotificationResponse> {
    await db.insert(notification).values({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? 'info',
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        metadata: input.metadata,
        createdAt: new Date(),
    })
    return { success: true }
}
