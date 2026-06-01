"use client"

import { SidebarProvider, useSidebar } from "@/components/navigation/sidebarprovider"
import { AdminSidebar } from "@/components/navigation/sidebar"
import { AdminAccessProvider } from "@/context/admin-access-context"
import { cn } from "@repo/ui/lib/utils"
import { useSession } from "@repo/auth/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageLoader } from "@repo/ui/components/ui/loader"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { updateLastLogin } from "@/actions/admin.action"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { data: session, isPending } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/")
        }
    }, [isPending, session, router])

    // Update lastLoginAt once per browser session (not on every page navigation)
    useEffect(() => {
        if (session && typeof window !== "undefined") {
            const key = "admin_login_tracked"
            if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, "1")
                updateLastLogin()
            }
        }
    }, [session])

    if (isPending) return <PageLoader />
    if (!session) return null

    return (
        <div className="h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            <AdminSidebar />
            <main
                className={cn(
                    "h-screen transition-all duration-300",
                    "lg:ml-64 p-2",
                    isCollapsed && "lg:ml-[90px]"
                )}
            >
                <div className="h-screen bg-white dark:bg-neutral-950 lg:rounded-l-3xl lg:border-l border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                    <ScrollArea className="h-full">
                        {children}
                    </ScrollArea>
                </div>
            </main>
        </div>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminAccessProvider>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </AdminAccessProvider>
        </SidebarProvider>
    )
}
