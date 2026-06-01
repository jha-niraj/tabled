export type AdminRole = "SUPER_ADMIN" | "TEAM_MEMBER"

export type AdminStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    TEAM_MEMBER: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

/** Flat admin user object as returned by getAdminUsers / getCurrentAdmin */
export interface AdminUser {
    id: string
    userId: string
    /** Alias for adminRole */
    role: AdminRole
    adminRole: AdminRole
    status: AdminStatus
    permissions: Record<string, string[]>
    name: string | null
    email: string
    image: string | null
    lastLoginAt: Date | null
    loginCount: number
    createdAt: Date
    updatedAt: Date
    user: {
        id: string
        name: string
        email: string
        image: string | null
    } | null
}
