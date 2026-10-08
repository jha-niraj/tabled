"use server"

import { db } from "@repo/db"
import { user, adminAccess, adminAuditLog } from "@repo/db/schema"
import { auth } from "@repo/auth"
import { headers } from "next/headers"
import { count, gte, lte, eq, and } from "@repo/db"

interface Response<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAnalyticsData(): Promise<Response<any>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user?.id) return { success: false, error: "Not authenticated" }

        const adminRecord = await db.query.adminAccess.findFirst({
            where: (a, { eq }) => eq(a.userId, session.user.id),
        })
        if (!adminRecord) return { success: false, error: "Not authorized" }

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)

        const [
            [totalUsersResult],
            [newUsersMonthResult],
            [newUsersWeekResult],
            [activeAdminsResult],
            [auditLogsMonthResult],
        ] = await Promise.all([
            db.select({ count: count() }).from(user),
            db.select({ count: count() }).from(user).where(gte(user.createdAt, thirtyDaysAgo)),
            db.select({ count: count() }).from(user).where(gte(user.createdAt, sevenDaysAgo)),
            db.select({ count: count() }).from(adminAccess).where(eq(adminAccess.status, "ACTIVE")),
            db.select({ count: count() }).from(adminAuditLog).where(gte(adminAuditLog.createdAt, thirtyDaysAgo)),
        ])

        // Build simple 7-day daily new users chart data
        const dailyData = []
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now)
            dayStart.setDate(dayStart.getDate() - i)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)
            const [result] = await db
                .select({ count: count() })
                .from(user)
                .where(and(gte(user.createdAt, dayStart), lte(user.createdAt, dayEnd)))
            dailyData.push({
                date: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
                users: result?.count ?? 0,
            })
        }

        return {
            success: true,
            data: {
                totalUsers: totalUsersResult?.count ?? 0,
                newUsersThisMonth: newUsersMonthResult?.count ?? 0,
                newUsersThisWeek: newUsersWeekResult?.count ?? 0,
                activeAdmins: activeAdminsResult?.count ?? 0,
                adminActionsThisMonth: auditLogsMonthResult?.count ?? 0,
                dailyNewUsers: dailyData,
            },
        }
    } catch (error) {
        console.error("Get analytics data error:", error)
        return { success: false, error: "Failed to fetch analytics data" }
    }
}
