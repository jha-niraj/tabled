import { Bell, Megaphone, TrendingUp, Send, FileText } from "lucide-react"
import Link from "next/link"
import { getPlatformAnnouncements } from "@/actions/announcements.action"
import { getBroadcasts } from "@/actions/broadcasts.action"
import { PermissionGate } from "@/components/permission-gate"

export const dynamic = "force-dynamic"
export const metadata = { title: "Communications" }

export default async function CommunicationsPage() {
    const [announcementsResult, broadcastsResult] = await Promise.allSettled([
        getPlatformAnnouncements(1, 1),
        getBroadcasts(1, 1),
    ])

    const totalAnnouncements = announcementsResult.status === "fulfilled" ? announcementsResult.value.total : 0
    const totalBroadcasts = broadcastsResult.status === "fulfilled" ? broadcastsResult.value.total : 0

    return (
        <PermissionGate module="communications" level="read">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                        <Send className="w-7 h-7 text-blue-500" />
                        Communications
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Manage platform announcements and broadcasts to your users
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/communications/announcements">
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex items-center gap-4 hover:border-orange-300 dark:hover:border-orange-700 transition-colors cursor-pointer">
                            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
                                    {totalAnnouncements}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Platform Announcements</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    Maintenance, releases, policy changes
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/communications/broadcasts">
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
                                    {totalBroadcasts}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Platform Broadcasts</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    Short notices sent via email
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick nav cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        {
                            href: "/communications/announcements",
                            icon: Bell,
                            title: "Announcements",
                            desc: "Send platform announcements about maintenance, new features, policy updates, and news to your users.",
                            iconBg: "bg-orange-100 dark:bg-orange-900/30",
                            iconColor: "text-orange-600 dark:text-orange-400",
                        },
                        {
                            href: "/communications/broadcasts",
                            icon: Megaphone,
                            title: "Broadcasts",
                            desc: "Create and send broadcast messages. Preview with a test email before sending. Wire up bulk delivery per product.",
                            iconBg: "bg-blue-100 dark:bg-blue-900/30",
                            iconColor: "text-blue-600 dark:text-blue-400",
                        },
                    ].map(({ href, icon: Icon, title, desc, iconBg, iconColor }) => (
                        <Link key={href} href={href}>
                            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group h-full">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                                    <Icon className={`w-5 h-5 ${iconColor}`} />
                                </div>
                                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1.5">{title}</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
                                <div className="mt-4 flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>Open {title}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Usage note */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Base Code Note</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Announcements use the <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">announcement</code> table.
                                Broadcasts use the <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">broadcast</code> table.
                                Wire up bulk email delivery in <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 rounded">broadcasts.action.ts</code> per product.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PermissionGate>
    )
}
