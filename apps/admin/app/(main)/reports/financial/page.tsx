"use client"

import { DollarSign, Download, TrendingUp, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"

const PLACEHOLDER_STATS = [
    { label: "Total Revenue", value: "$0", trend: "Connect payment provider", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: DollarSign },
    { label: "Monthly Revenue", value: "$0", trend: "This month", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: TrendingUp },
    { label: "Transactions", value: "0", trend: "Total processed", color: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: BarChart3 },
    { label: "Growth", value: "0%", trend: "Month over month", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: TrendingUp },
]

export default function FinancialReportPage() {
    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Reports</span>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Financial Report</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Revenue, transactions, and financial metrics</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {PLACEHOLDER_STATS.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.color)}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.label}</p>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">{s.value}</p>
                        <p className="text-xs text-neutral-400 mt-1">{s.trend}</p>
                    </motion.div>
                ))}
            </div>

            {/* Placeholder charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["Revenue Over Time", "Transaction Volume"].map((title) => (
                    <div key={title} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                        <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">{title}</h2>
                        <div className="h-40 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                            <div className="text-center">
                                <DollarSign className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                <p className="text-xs text-neutral-400 font-medium">Connect a payment provider</p>
                                <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">e.g. Stripe, Razorpay, Paddle</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Setup guide */}
            <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 p-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Set up Financial Reporting</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    Connect a payment provider to automatically populate this dashboard with real financial data.
                </p>
                <div className="flex flex-wrap gap-2">
                    {["Stripe", "Razorpay", "Paddle", "PayPal", "LemonSqueezy"].map((provider) => (
                        <span key={provider} className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
                            {provider}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
