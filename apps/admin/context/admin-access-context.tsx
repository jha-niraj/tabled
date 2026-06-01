"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentAdmin } from "@/actions/admin.action"
import {
    defaultPermissionsByRole,
    hasPermission,
    type AdminPermissions,
    type AdminPermission,
    type PermissionLevel,
} from "@/lib/navigation"

interface AdminAccessContextValue {
    adminRole: string | null
    permissions: AdminPermissions
    isSuperAdmin: boolean
    loading: boolean
    /** Check if the current admin can perform an action on a module. */
    can: (module: AdminPermission, level?: PermissionLevel) => boolean
}

const AdminAccessContext = createContext<AdminAccessContextValue>({
    adminRole: null,
    permissions: {},
    isSuperAdmin: false,
    loading: true,
    can: () => false,
})

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<AdminPermissions>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getCurrentAdmin().then((res) => {
            if (res.success && res.data) {
                const role = res.data.role as string
                setAdminRole(role)
                // SUPER_ADMIN gets full default permissions regardless of DB value
                setPermissions(
                    role === "SUPER_ADMIN"
                        ? defaultPermissionsByRole["SUPER_ADMIN"]!
                        : ((res.data.permissions as AdminPermissions | undefined) ?? {}),
                )
            }
            setLoading(false)
        })
    }, [])

    const isSuperAdmin = adminRole === "SUPER_ADMIN"

    const can = (module: AdminPermission, level: PermissionLevel = "read"): boolean => {
        if (isSuperAdmin) return true
        return hasPermission(permissions, module, level)
    }

    return (
        <AdminAccessContext.Provider value={{ adminRole, permissions, isSuperAdmin, loading, can }}>
            {children}
        </AdminAccessContext.Provider>
    )
}

export function useAdminAccess() {
    return useContext(AdminAccessContext)
}
