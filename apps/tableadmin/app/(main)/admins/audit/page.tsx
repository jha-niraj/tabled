"use client"

import { PermissionGate } from "@/components/permission-gate"
import { useAdminAccess } from "@/context/admin-access-context"
import { AuditLogsClient } from "./_components/audit-logs-client"

export default function AuditLogsPage() {
    const { isSuperAdmin } = useAdminAccess()

    return (
        <PermissionGate module="admin_management" level="read">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <AuditLogsClient isSuperAdmin={isSuperAdmin} />
            </div>
        </PermissionGate>
    )
}
