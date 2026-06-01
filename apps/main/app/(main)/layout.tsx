"use client"

import { SidebarProvider, useSidebar } from "@/components/navigation/sidebarprovider"
import { MainSidebar } from "@/components/navigation/sidebar"
import { cn } from "@repo/ui/lib/utils"
import { useSession } from "@repo/auth/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageLoader } from "@repo/ui/components/ui/loader"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { data: session, isPending } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/signin")
        }
    }, [isPending, session, router])

    if (isPending) return <PageLoader />
    if (!session) return null

    return (
        <div className="h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            <MainSidebar />
            <main
                className={cn(
                    "h-screen transition-all duration-300",
                    "lg:ml-64 p-2",
                    isCollapsed && "lg:ml-[90px]"
                )}
            >
                <div className="h-screen bg-white dark:bg-neutral-950 lg:rounded-l-3xl lg:border-l border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
                    <ScrollArea className="h-full">
                        <div style={{ padding: "clamp(24px,3vw,40px) clamp(16px,3vw,32px)" }}>
                            {children}
                        </div>
                    </ScrollArea>
                </div>
            </main>
        </div>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </SidebarProvider>
    )
}
