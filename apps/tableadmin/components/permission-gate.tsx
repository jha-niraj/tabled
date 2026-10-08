"use client"

import { useAdminAccess } from "@/context/admin-access-context"
import type { AdminPermission, PermissionLevel } from "@/lib/navigation"
import { ShieldOff } from "lucide-react"
import Link from "next/link"

interface PermissionGateProps {
    module: AdminPermission
    level?: PermissionLevel
    children: React.ReactNode
    fallback?: React.ReactNode
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <ShieldOff className="w-7 h-7 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Access restricted
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
                You don&apos;t have permission to view this page. Contact a super admin to request access.
            </p>
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
                Back to dashboard
            </Link>
        </div>
    )
}

export function PermissionGate({ module, level = "read", children, fallback }: PermissionGateProps) {
    const { can, loading } = useAdminAccess()

    // While loading, render nothing - the layout already shows a loader
    if (loading) return null

    if (can(module, level)) return <>{children}</>

    return <>{fallback ?? <AccessDenied />}</>
}

/** Convenience hook - returns true if the current admin can perform this action. */
export function useCanAccess(module: AdminPermission, level: PermissionLevel = "read"): boolean {
    const { can } = useAdminAccess()
    return can(module, level)
}
