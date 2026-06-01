"use client"

import { useState, useEffect } from "react"
import { Shield, Download, Users } from "lucide-react"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { getAuditLogs } from "@/actions/admin.action"
import { cn } from "@repo/ui/lib/utils"
import { motion } from "framer-motion"

interface LogEntry {
    id: string
    action: string
    module: string
    description: string | null
    createdAt: string | Date
    adminUser?: { name: string | null; email: string | null } | null
}

interface AdminSummary {
    email: string
    name: string | null
    actions: number
    lastActive: Date
}

export default function AdminActivityReportPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAuditLogs(1, 200).then((res) => {
            if (res.success) setLogs(res.data?.logs ?? [])
            setLoading(false)
        })
    }, [])

    const adminSummaries: AdminSummary[] = Object.values(
        logs.reduce<Record<string, AdminSummary>>((acc, log) => {
            const key = log.adminUser?.email || "unknown"
            if (!acc[key]) {
                acc[key] = {
                    email: key,
                    name: log.adminUser?.name ?? null,
                    actions: 0,
                    lastActive: new Date(log.createdAt),
                }
            }
            acc[key].actions++
            const logDate = new Date(log.createdAt)
            if (logDate > acc[key].lastActive) acc[key].lastActive = logDate
            return acc
        }, {})
    ).sort((a, b) => b.actions - a.actions)

    const actionBreakdown = logs.reduce<Record<string, number>>((acc, log) => {
        acc[log.action] = (acc[log.action] ?? 0) + 1
        return acc
    }, {})

    function handleExport() {
        const csv = [
            ["Admin", "Email", "Total Actions", "Last Active"],
            ...adminSummaries.map((a) => [a.name || "-", a.email, a.actions, a.lastActive.toLocaleString()]),
        ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")

        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `admin-activity-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <Shield className="w-4 h-4" />
                        <span>Reports</span>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Admin Activity</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Per-admin action breakdown and summary</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Admin summary table */}
                <div className="lg:col-span-2">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Admin Breakdown</h2>
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <InlineLoader size={32} />
                            </div>
                        ) : adminSummaries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-3" />
                                <p className="text-neutral-500">No admin activity found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Admin</th>
                                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
                                        <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminSummaries.map((a, i) => (
                                        <tr key={a.email} className={cn("hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors", i < adminSummaries.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">
                                                            {(a.name || a.email)[0]?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{a.name || "Admin"}</p>
                                                        <p className="text-xs text-neutral-500 truncate">{a.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">{a.actions}</span>
                                                    <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full max-w-[80px]">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                                                            style={{ width: `${Math.min((a.actions / (adminSummaries[0]?.actions ?? 1)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-neutral-500 hidden sm:table-cell">
                                                {a.lastActive.toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Action breakdown */}
                <div>
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">Action Types</h2>
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                            ))
                        ) : (
                            Object.entries(actionBreakdown)
                                .sort(([, a], [, b]) => b - a)
                                .map(([action, count]) => (
                                    <motion.div
                                        key={action}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{action}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
                                                    style={{ width: `${(count / logs.length) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-neutral-900 dark:text-white w-8 text-right">{count}</span>
                                        </div>
                                    </motion.div>
                                ))
                        )}
                    </div>

                    {/* Total */}
                    <div className="mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1">Total Logged Actions</p>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-white">{loading ? "-" : logs.length}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
