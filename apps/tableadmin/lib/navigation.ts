import {
    Home, Users, BarChart3, Settings, Shield,
    type LucideIcon, Activity, Lock, Megaphone, Radio,
    ClipboardList, DollarSign, MessageSquare
} from "lucide-react"

export interface NavigationItem {
    name: string
    path: string
    icon: LucideIcon
    children?: NavigationItem[]
    requiredPermission?: string
    /** When true, clicking the parent only expands children — doesn't navigate to the path */
    noRoute?: boolean
}

export interface NavigationConfig {
    primary: NavigationItem[]
    secondary: NavigationItem[]
}

export const adminNavigation: NavigationConfig = {
    primary: [
        {
            name: "Home",
            path: "home",
            icon: Home,
        },
        {
            name: "Analytics",
            path: "analytics",
            icon: BarChart3,
            requiredPermission: "analytics",
        },
        {
            name: "Users",
            path: "users",
            icon: Users,
            requiredPermission: "users",
        },
        {
            name: "Reports",
            path: "reports",
            icon: ClipboardList,
            requiredPermission: "analytics",
            noRoute: true,
            children: [
                { name: "Admin Activity", path: "reports/admin-activity", icon: Shield },
                { name: "Financial Report", path: "reports/financial", icon: DollarSign },
            ],
        },
        {
            name: "Communications",
            path: "communications",
            icon: MessageSquare,
            requiredPermission: "communications",
            // /communications shows an overview page — not noRoute
            children: [
                { name: "Announcements", path: "communications/announcements", icon: Megaphone },
                { name: "Broadcasts", path: "communications/broadcasts", icon: Radio },
            ],
        },
    ],
    secondary: [
        {
            name: "Admin Management",
            path: "admins",
            icon: Shield,
            requiredPermission: "admin_management",
            // "admins" is a valid route — navigates to /admins (admin list)
            // Children are sub-pages under admin management
            children: [
                { name: "Audit Logs", path: "admins/audit", icon: Activity },
                { name: "Access Control", path: "admins/access", icon: Lock },
            ],
        },
        {
            name: "System",
            path: "system/settings",
            icon: Settings,
            requiredPermission: "system",
            noRoute: false,   // /system has no page; only sub-pages exist
            children: [
                { name: "Settings", path: "system/settings", icon: Settings },
            ],
        },
    ],
}

export type AdminPermission =
    | "users"
    | "analytics"
    | "communications"
    | "admin_management"
    | "system"

export type PermissionLevel = "read" | "write" | "delete" | "full"

export interface AdminPermissions {
    [key: string]: PermissionLevel[]
}

export const defaultPermissionsByRole: Record<string, AdminPermissions> = {
    SUPER_ADMIN: {
        users: ["read", "write", "delete", "full"],
        analytics: ["read", "write", "full"],
        communications: ["read", "write", "delete", "full"],
        admin_management: ["read", "write", "delete", "full"],
        system: ["read", "write", "full"],
    },
    TEAM_MEMBER: {},
}

export function hasPermission(
    permissions: AdminPermissions,
    module: AdminPermission,
    level: PermissionLevel,
): boolean {
    const modulePermissions = permissions[module]
    if (!modulePermissions) return false
    return modulePermissions.includes(level) || modulePermissions.includes("full")
}

export function getNavigationForPermissions(
    permissions: AdminPermissions,
    adminRole?: string,
): NavigationConfig {
    if (adminRole === "SUPER_ADMIN") return adminNavigation

    const filterItems = (items: NavigationItem[]): NavigationItem[] => {
        return items
            .filter((item) => {
                if (!item.requiredPermission) return true
                return hasPermission(permissions, item.requiredPermission as AdminPermission, "read")
            })
            .map((item) => ({
                ...item,
                children: item.children ? filterItems(item.children) : undefined,
            }))
    }

    return {
        primary: filterItems(adminNavigation.primary),
        secondary: filterItems(adminNavigation.secondary),
    }
}
