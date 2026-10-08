import type { PlatformAnnouncement } from "@/actions/announcements.action"
import { getPlatformAnnouncements } from "@/actions/announcements.action"
import { AnnouncementsClient } from "./_components/announcements-client"
import { PermissionGate } from "@/components/permission-gate"

export const dynamic = "force-dynamic"
export const metadata = { title: "Announcements" }

interface PageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function AnnouncementsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = Math.max(1, parseInt(params.page ?? "1") || 1)

    let announcements: PlatformAnnouncement[] = []
    let total = 0
    let totalPages = 1
    let error: string | undefined

    try {
        const data = await getPlatformAnnouncements(page, 20)
        announcements = data.announcements
        total = data.total
        totalPages = data.totalPages
    } catch (err) {
        error = err instanceof Error ? err.message : "Failed to load announcements"
    }

    // No wrapper div here — the split panel uses negative margins to reach the edges,
    // just like broadcasts/page.tsx. A max-w-7xl wrapper creates dead space on the right.
    return (
        <PermissionGate module="communications" level="read">
            <AnnouncementsClient
                announcements={announcements}
                total={total}
                totalPages={totalPages}
                currentPage={page}
                error={error}
            />
        </PermissionGate>
    )
}
