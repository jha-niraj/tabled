"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
    ArrowRight, BarChart3, MessageSquare, Settings, Activity, UserPlus, Users, Shield
} from "lucide-react"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { cn } from "@repo/ui/lib/utils"
import { getDashboardStats, getAuditLogs } from "@/actions/admin.action"
import { useEffect, useState } from "react"

// ─── Mock monthly data (replace with real data per product) ──────────────────

function generateMonthly() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => ({
        month: months[(now.getMonth() - 11 + i + 12) % 12]!,
        users: Math.floor(Math.random() * 30 + 10 + i * 3),
    }))
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload?.length) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-1">{label}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                        <span className="text-neutral-500">{p.name}:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{p.value}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] as const }
    })
}

function StatCard({ label, value, sub, icon: Icon, href, index, color = "text-neutral-600 dark:text-neutral-300", bg = "bg-neutral-100 dark:bg-neutral-800" }: {
    label: string; value: number | string; sub: string; icon: React.ElementType
    href: string; index: number; color?: string; bg?: string
}) {
    return (
        <motion.div variants={fadeUp} custom={index} initial="hidden" animate="show" className="h-full">
            <Link href={href} className="group block h-full">
                <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all flex flex-col gap-3">
                    <div className={cn("p-2 rounded-lg w-fit", bg)}>
                        <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-white tabular-nums">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{sub}</p>
                    </div>
                    <div className="mt-auto pt-1 flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        <span>View all</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

const QUICK_LINKS = [
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Users", href: "/users", icon: Users },
    { label: "Communications", href: "/communications/announcements", icon: MessageSquare },
    { label: "System Settings", href: "/system/settings", icon: Settings },
]

interface Stats { totalUsers: number; newUsersThisMonth: number; activeToday: number; totalAdmins: number }
interface LogEntry { id: string; action: string; module: string; description: string | null; createdAt: string; adminUser?: { name: string | null; email: string | null } | null }

export default function AdminHomePage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [monthlyData] = useState(generateMonthly)
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

    useEffect(() => {
        getDashboardStats().then(r => { if (r.success) setStats(r.data) })
        getAuditLogs(1, 5).then(r => { if (r.success) setLogs(r.data?.logs ?? []) })
    }, [])

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Home</h1>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">{today}</p>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats?.totalUsers ?? 0} sub={`+${stats?.newUsersThisMonth ?? 0} this month`} icon={Users} href="/users" index={0} color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-950/40" />
                <StatCard label="New This Month" value={stats?.newUsersThisMonth ?? 0} sub="new signups" icon={UserPlus} href="/users" index={1} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" />
                <StatCard label="Joined Today" value={stats?.activeToday ?? 0} sub="users today" icon={Activity} href="/users" index={2} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/40" />
                <StatCard label="Active Admins" value={stats?.totalAdmins ?? 0} sub="with active status" icon={Shield} href="/admins" index={3} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/40" />
            </div>

            {/* Charts + Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    variants={fadeUp} custom={4} initial="hidden" animate="show"
                    className="lg:col-span-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
                >
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">User Growth</h2>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-5">New users joined per month (mock data - replace with real)</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.15} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Users" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    variants={fadeUp} custom={5} initial="hidden" animate="show"
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
                >
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4">Quick Access</h2>
                    <div className="space-y-2">
                        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                                        <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
                            </Link>
                        ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">Total users</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">{stats?.totalUsers ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">Active admins</span>
                            <span className="font-semibold text-neutral-900 dark:text-white">{stats?.totalAdmins ?? 0}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent activity */}
            <motion.div
                variants={fadeUp} custom={6} initial="hidden" animate="show"
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Recent Activity</h2>
                    <Link href="/admins/audit" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                        View all <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 text-sm">No recent activity</div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 px-6 py-3.5">
                                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Activity className="w-3.5 h-3.5 text-neutral-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                        {log.description || `${log.action} on ${log.module}`}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                        {log.adminUser?.name || log.adminUser?.email || "Admin"} · {log.module}
                                    </p>
                                </div>
                                <span className="text-[10px] text-neutral-400 whitespace-nowrap flex-shrink-0 font-mono">
                                    {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
