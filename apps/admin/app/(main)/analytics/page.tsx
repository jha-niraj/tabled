"use client"

import { motion } from "framer-motion"
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts"
import { Users, TrendingUp, Activity, UserPlus, BarChart2 } from "lucide-react"
import { PermissionGate } from "@/components/permission-gate"

// ─── Mock data - replace with real product data ───────────────────────────────

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const now = new Date()

const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: months[(now.getMonth() - 11 + i + 12) % 12]!,
    newUsers: Math.floor(Math.random() * 40 + 15 + i * 2),
    activeUsers: Math.floor(Math.random() * 80 + 40 + i * 3),
}))

const MOCK = {
    summary: { totalUsers: 1248, newThisMonth: 87, activeThisWeek: 342, admins: 4 },
    today: { newSignups: 12, activeUsers: 89, actions: 234 },
    featureUse: { withAvatar: 423, withBio: 201, active: 342, total: 1248 },
}

const avatarPct = Math.round((MOCK.featureUse.withAvatar / MOCK.featureUse.total) * 100)
const bioPct = Math.round((MOCK.featureUse.withBio / MOCK.featureUse.total) * 100)
const activePct = Math.round((MOCK.featureUse.active / MOCK.featureUse.total) * 100)

const statusChartData = [
    { name: "Active Week", value: MOCK.featureUse.active },
    { name: "With Avatar", value: MOCK.featureUse.withAvatar },
    { name: "With Bio", value: MOCK.featureUse.withBio },
]

// ─── Tooltip ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload?.length) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">{label}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke || p.fill }} />
                        <span className="text-neutral-500">{p.name}:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">{p.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.4, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] as const }
    })
}

const SUMMARY_CARDS = [
    { key: "totalUsers", label: "Total Users", icon: Users },
    { key: "newThisMonth", label: "New This Month", icon: UserPlus },
    { key: "activeThisWeek", label: "Active This Week", icon: Activity },
    { key: "admins", label: "Active Admins", icon: TrendingUp },
]

export default function AnalyticsPage() {
    return (
        <PermissionGate module="analytics" level="read">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
                        Last 12 months - using mock data. Wire up real data per product.
                    </p>
                </motion.div>

                {/* Summary cards */}
                <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SUMMARY_CARDS.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-2">
                            <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 w-fit">
                                <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                            </div>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
                                {MOCK.summary[key as keyof typeof MOCK.summary].toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Today activity */}
                <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Today&apos;s Activity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { label: "New Signups", value: MOCK.today.newSignups, desc: "Users who joined today" },
                            { label: "Active Users", value: MOCK.today.activeUsers, desc: "Users active today" },
                            { label: "Actions Logged", value: MOCK.today.actions, desc: "Admin actions today" },
                        ].map(({ label, value, desc }) => (
                            <div key={label} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                                    <Activity className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">{value}</p>
                                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Line chart: signups over time */}
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">New Signups & Active Users</h2>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-5">Monthly trend over the last 12 months</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.15} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={32} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="newUsers" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="New Signups" />
                            <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="Active Users" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Feature adoption */}
                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart2 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Profile Completion</h2>
                    </div>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-6">
                        How many of {MOCK.featureUse.total} users have completed their profiles
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            {[
                                { label: "Users with avatar", count: MOCK.featureUse.withAvatar, pct: avatarPct, color: "bg-violet-500" },
                                { label: "Users with bio", count: MOCK.featureUse.withBio, pct: bioPct, color: "bg-emerald-500" },
                                { label: "Active this week", count: MOCK.featureUse.active, pct: activePct, color: "bg-blue-500" },
                            ].map(({ label, count, pct, color }) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
                                        <span className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                                            {count}<span className="text-neutral-400 font-normal ml-1">({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">User Activity Overview</p>
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={statusChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.15} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Users">
                                        <Cell fill="#8b5cf6" />
                                        <Cell fill="#10b981" />
                                        <Cell fill="#3b82f6" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PermissionGate>
    )
}
