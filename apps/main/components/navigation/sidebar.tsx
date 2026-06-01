"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "@repo/auth/client"
import { cn } from "@repo/ui/lib/utils"
import { LogOut, ChevronLeft, ChevronRight, Bell, User } from "lucide-react"
import {
    Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
} from "@repo/ui/components/ui/tooltip"
import { useSidebar } from "./sidebarprovider"
import { toast } from "@repo/ui/components/ui/sonner"
import Image from "next/image"
import { mainNavigation, type NavigationItem } from "@/lib/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/ui/sheet"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { ThemeToggle } from "@repo/ui/components/themetoggle"
import { useMainProfileStore } from "@/stores/main-profile.store"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/actions/notification.action"

type NotifItem = {
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    actionUrl?: string | null
    createdAt: Date | string
}

export function MainSidebar() {
    const { isCollapsed, setIsCollapsed } = useSidebar()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const storeImage = useMainProfileStore(state => state.avatarUrl)
    const displayImage = storeImage ?? session?.user?.image ?? null

    const navItems = mainNavigation.primary
    const secondaryItems = mainNavigation.secondary

    const [unreadCount, setUnreadCount] = useState(0)
    const [notifSheetOpen, setNotifSheetOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotifItem[]>([])
    const [notifLoading, setNotifLoading] = useState(false)

    useEffect(() => {
        if (!session) return
        loadUnreadCount()
        const interval = setInterval(loadUnreadCount, 60_000)
        return () => clearInterval(interval)
    }, [session])

    async function loadUnreadCount() {
        try {
            const res = await getUnreadCount()
            if (res.success && res.data !== undefined) setUnreadCount(res.data)
        } catch { /* silent */ }
    }

    async function handleOpenNotifications() {
        setNotifSheetOpen(true)
        setNotifLoading(true)
        try {
            const res = await getNotifications(1, 30)
            if (res.success && res.data) {
                setNotifications(res.data.items as NotifItem[])
                setUnreadCount(res.data.unread)
            }
        } finally { setNotifLoading(false) }
    }

    async function handleMarkAllRead() {
        await markAllAsRead()
        setUnreadCount(0)
        setNotifications(n => n.map(x => ({ ...x, isRead: true })))
    }

    async function handleMarkRead(id: string) {
        await markAsRead(id)
        setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
        setUnreadCount(c => Math.max(0, c - 1))
    }

    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    const handleSignOut = async () => {
        await signOut()
        toast.success("Signed out")
        window.location.href = "/signin"
    }

    const isPathActive = useCallback((itemPath: string) => {
        const fullPath = itemPath.startsWith("/") ? itemPath : `/${itemPath}`
        return pathname === fullPath || pathname.startsWith(`${fullPath}/`)
    }, [pathname])

    const renderNavItem = (item: NavigationItem, depth: number = 0) => {
        const isActive = isPathActive(item.path)
        const Icon = item.icon

        const linkContent = (
            <Link
                key={item.path}
                href={`/${item.path}`}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                    depth > 0 && "text-xs px-2.5 py-2",
                    isActive
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800/50",
                    isCollapsed && "justify-center px-3"
                )}
            >
                <Icon className={cn("flex-shrink-0", depth > 0 ? "h-4 w-4" : "h-5 w-5")} />
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
            </Link>
        )

        return isCollapsed ? (
            <Tooltip key={item.path}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="bg-neutral-900 dark:bg-white text-white dark:text-black border-neutral-800 dark:border-neutral-200">
                    {item.name}
                </TooltipContent>
            </Tooltip>
        ) : linkContent
    }

    const isAuthenticated = !isPending && !!session

    const renderSidebarContent = () => (
        <>
            {/* Logo / brand */}
            <div className={cn(
                "relative flex shrink-0 items-center border-b border-neutral-200 dark:border-neutral-800",
                isCollapsed ? "justify-center px-3 py-4" : "gap-3 px-4 py-4 pr-5",
            )}>
                <Link
                    href="/home"
                    className={cn(
                        "flex min-w-0 items-center gap-3 rounded-lg outline-offset-2 transition-opacity hover:opacity-90",
                        !isCollapsed && "flex-1",
                        isCollapsed && "justify-center",
                    )}
                >
                    <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                        <span className="text-white dark:text-black font-bold text-sm">Y</span>
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1 text-left">
                            <h1 className="truncate font-bold tracking-tight text-neutral-900 dark:text-white">
                                YourApp
                            </h1>
                            <p className="truncate font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                                Dashboard
                            </p>
                        </div>
                    )}
                </Link>
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-1/2 -right-3 z-50 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-1 shadow-lg transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 lg:block"
                >
                    {isCollapsed
                        ? <ChevronRight className="w-4 h-4 text-neutral-900 dark:text-white" />
                        : <ChevronLeft className="w-4 h-4 text-neutral-900 dark:text-white" />
                    }
                </button>
            </div>

            {/* Nav items */}
            <ScrollArea className="flex-1 min-h-0">
                <nav className="px-3 py-4 space-y-1">
                    {navItems?.map((item) => renderNavItem(item))}
                    {secondaryItems && secondaryItems.length > 0 && (
                        <>
                            <div className="pt-4 pb-2">
                                {!isCollapsed && (
                                    <p className="text-[10px] font-mono font-bold uppercase text-neutral-500 dark:text-neutral-400 px-2 tracking-widest">
                                        More
                                    </p>
                                )}
                            </div>
                            {secondaryItems.map((item) => renderNavItem(item))}
                        </>
                    )}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="mt-auto shrink-0 border-t border-neutral-200 dark:border-neutral-800">
                {/* ThemeToggle + notification bell */}
                {!isCollapsed && isAuthenticated && (
                    <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2">
                        <div className="cursor-pointer">
                            <ThemeToggle />
                        </div>
                        <div className="relative ml-auto">
                            <button
                                onClick={handleOpenNotifications}
                                className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Notifications"
                            >
                                <Bell className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Profile row */}
                {isAuthenticated && session ? (
                    <div className={cn("flex items-center gap-2 px-3 py-3", isCollapsed && "justify-center px-2")}>
                        <button
                            type="button"
                            onClick={() => router.push("/profile")}
                            className="cursor-pointer flex-shrink-0"
                            title="My profile"
                        >
                            {displayImage ? (
                                <Image
                                    className="h-8 w-8 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover"
                                    src={displayImage}
                                    alt={session.user.name || "User"}
                                    width={32}
                                    height={32}
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-black dark:bg-white flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
                                    <span className="text-white dark:text-black text-xs font-bold">
                                        {session?.user?.name?.[0]?.toUpperCase() || "U"}
                                    </span>
                                </div>
                            )}
                        </button>

                        {!isCollapsed && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => router.push("/profile")}
                                    className="cursor-pointer flex-1 min-w-0 hidden lg:block text-left rounded-lg px-1.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Go to profile"
                                >
                                    <p className="text-sm font-semibold truncate text-neutral-900 dark:text-white leading-tight">
                                        {session?.user?.name || "User"}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate font-mono">
                                        Dashboard
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    title="Sign out"
                                    className="cursor-pointer flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {isCollapsed && (
                            <button
                                type="button"
                                onClick={handleSignOut}
                                title="Sign out"
                                className="cursor-pointer p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="px-3 py-2">
                        <button
                            type="button"
                            onClick={() => router.push("/signin")}
                            className={cn(
                                "flex w-full items-center rounded-lg p-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
                                isCollapsed && "justify-center",
                            )}
                        >
                            <User className="h-5 w-5" />
                            {!isCollapsed && <span className="ml-3">Sign In</span>}
                        </button>
                    </div>
                )}
            </div>
        </>
    )

    return (
        <TooltipProvider>
            {/* Mobile hamburger */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="fixed top-3 right-3 z-50 lg:hidden bg-white/90 dark:bg-neutral-950/90 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm backdrop-blur-sm"
                aria-label="Toggle sidebar"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Desktop sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950",
                    "hidden lg:flex",
                    isCollapsed ? "lg:w-[90px]" : "lg:w-64",
                )}
            >
                {renderSidebarContent()}
            </aside>

            {/* Mobile Sheet */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="w-64 border-neutral-200 bg-white p-0 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex h-full flex-col">
                        {renderSidebarContent()}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Notification Sheet */}
            <Sheet open={notifSheetOpen} onOpenChange={setNotifSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                    <SheetHeader className="flex-none px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <SheetTitle className="text-base font-semibold text-neutral-900 dark:text-white">
                                    Notifications
                                </SheetTitle>
                                {unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="cursor-pointer text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors bg-transparent border-0"
                                    style={{ fontFamily: "inherit" }}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        {notifLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-700 animate-pulse" />
                                <p className="text-sm text-neutral-400 dark:text-neutral-500">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No notifications yet</p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => {
                                            handleMarkRead(n.id)
                                            if (n.actionUrl) router.push(n.actionUrl)
                                        }}
                                        className={cn(
                                            "w-full text-left px-6 py-4 transition-colors cursor-pointer",
                                            "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                                            !n.isRead && "bg-blue-50/30 dark:bg-blue-500/5"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                                                n.isRead ? "bg-neutral-300 dark:bg-neutral-700" : "bg-blue-500"
                                            )} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={cn(
                                                        "text-sm leading-snug",
                                                        n.isRead
                                                            ? "text-neutral-600 dark:text-neutral-400 font-normal"
                                                            : "text-neutral-900 dark:text-white font-medium"
                                                    )}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0 font-mono">
                                                        {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                {n.type && (
                                                    <span className={cn(
                                                        "inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium",
                                                        n.type === "success" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
                                                        n.type === "warning" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                                                        n.type === "error" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                                                        n.type === "info" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                                                    )}>
                                                        {n.type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    )
}
