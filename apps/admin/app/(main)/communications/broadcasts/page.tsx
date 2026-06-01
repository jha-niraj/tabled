import type { PlatformBroadcast } from "@/actions/broadcasts.action"
import { getBroadcasts } from "@/actions/broadcasts.action"
import { BroadcastsClient } from "./_components/broadcasts-client"
import { PermissionGate } from "@/components/permission-gate"

export const dynamic = "force-dynamic"
export const metadata = { title: "Broadcasts" }

export default async function BroadcastsPage() {
    let broadcasts: PlatformBroadcast[] = []
    let total = 0
    try {
        const data = await getBroadcasts(1, 50)
        broadcasts = data.broadcasts
        total = data.total
    } catch { /* handled gracefully in client */ }

    return (
        <PermissionGate module="communications" level="read">
            <BroadcastsClient broadcasts={broadcasts} total={total} />
        </PermissionGate>
    )
}
