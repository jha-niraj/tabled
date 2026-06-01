"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Activity, Shield, Filter, Globe, Box, Calendar, ChevronRight
} from "lucide-react"
import {
    format, formatDistanceToNow,
    subHours, subDays, startOfWeek, startOfMonth, subMonths
} from "date-fns"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/ui/sheet"
import { Badge } from "@repo/ui/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import {
    getAuditLogsFiltered, getAdminList,
    type AuditLogWithAdmin, type AdminListItem
} from "@/actions/admin.action"

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULE_OPTIONS = [
    { value: "admin_management", label: "Admin Management" },
    { value: "users", label: "Users" },
    { value: "analytics", label: "Analytics" },
    { value: "communications", label: "Communications" },
    { value: "system", label: "System" },
] as const

type FilterKey = "hour" | "day" | "week" | "month" | "3months" | "all" | "custom"

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
    { key: "hour", label: "Last 1 hour" },
    { key: "day", label: "Last 24 hours" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "3months", label: "Last 3 months" },
    { key: "all", label: "All time" },
]

function getDateRange(filter: FilterKey, customFrom?: string, customTo?: string): { from?: Date; to?: Date } {
    const now = new Date()
    switch (filter) {
        case "hour": return { from: subHours(now, 1) }
        case "day": return { from: subDays(now, 1) }
        case "week": return { from: startOfWeek(now, { weekStartsOn: 1 }) }
        case "month": return { from: startOfMonth(now) }
        case "3months": return { from: subMonths(now, 3) }
        case "all": return {}
        case "custom": return {
            from: customFrom ? new Date(customFrom) : undefined,
            to: customTo ? new Date(customTo + "T23:59:59") : undefined,
        }
        default: return {}
    }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
    const upper = action.toUpperCase()
    let cls = "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-0"
    if (upper === "CREATE") cls = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0"
    else if (upper === "UPDATE") cls = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-0"
    else if (upper === "DELETE") cls = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0"
    else if (upper === "LOGIN") cls = "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-0"
    return <Badge variant="secondary" className={`text-xs font-medium px-2 py-0.5 ${cls}`}>{action}</Badge>
}

function ModuleBadge({ module }: { module: string }) {
    return (
        <Badge variant="outline" className="text-xs font-normal px-2 py-0.5 text-neutral-500 dark:text-neutral-400">
            {module.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </Badge>
    )
}

function AvatarInitials({ name, email }: { name: string | null; email: string | null }) {
    const display = name ?? email ?? "?"
    const initials = display.split(" ").map(p => p[0]?.toUpperCase() ?? "").slice(0, 2).join("")
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 select-none">
            {initials || "?"}
        </div>
    )
}

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({ log, onClick }: { log: AuditLogWithAdmin; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                        {log.adminUser?.name ?? "Unknown Admin"}
                    </span>
                    <span className="text-xs text-neutral-400 truncate hidden sm:inline">
                        {log.adminUser?.email ?? ""}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <ActionBadge action={log.action} />
                    <ModuleBadge module={log.module} />
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
                </div>
            </div>
            {log.description && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 truncate">{log.description}</p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                {log.resourceType && (
                    <span className="flex items-center gap-1">
                        <Box className="h-3 w-3" />
                        {log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}
                    </span>
                )}
                {log.ipAddress && (
                    <span className="flex items-center gap-1 font-mono">
                        <Globe className="h-3 w-3" />{log.ipAddress}
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DetailSheet({ log, open, onOpenChange }: { log: AuditLogWithAdmin | null; open: boolean; onOpenChange: (v: boolean) => void }) {
    if (!log) return null
    const rows = [
        { label: "Action", value: log.action },
        { label: "Module", value: log.module.replace(/_/g, " ") },
        { label: "Resource Type", value: log.resourceType },
        { label: "Resource ID", value: log.resourceId, mono: true },
        { label: "IP Address", value: log.ipAddress, mono: true },
        { label: "Admin Role", value: log.adminRole },
    ]
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <AvatarInitials name={log.adminUser?.name ?? null} email={log.adminUser?.email ?? null} />
                        <div className="min-w-0">
                            <SheetTitle className="text-base font-semibold text-neutral-900 dark:text-white">
                                {log.adminUser?.name ?? "Unknown Admin"}
                            </SheetTitle>
                            <p className="text-sm text-neutral-500 truncate">{log.adminUser?.email ?? "-"}</p>
                        </div>
                    </div>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <ActionBadge action={log.action} />
                        <ModuleBadge module={log.module} />
                    </div>
                    <div className="space-y-3">
                        {rows.map(({ label, value, mono }) => value ? (
                            <div key={label} className="flex justify-between gap-4 text-sm">
                                <span className="text-neutral-500 shrink-0">{label}</span>
                                <span className={`text-neutral-900 dark:text-white text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
                            </div>
                        ) : null)}
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                        <span className="text-neutral-500 shrink-0 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />Timestamp
                        </span>
                        <span className="text-neutral-900 dark:text-white text-right text-xs font-mono">
                            {format(new Date(log.createdAt), "PPP 'at' HH:mm:ss")}
                        </span>
                    </div>
                    {log.description && (
                        <div className="space-y-1.5">
                            <p className="text-sm text-neutral-500">Description</p>
                            <p className="text-sm text-neutral-900 dark:text-white leading-relaxed bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2.5">
                                {log.description}
                            </p>
                        </div>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-sm text-neutral-500">Metadata</p>
                            <pre className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-sm text-neutral-500">Changes</p>
                            <pre className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(log.changes, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

interface LeftPanelProps {
    selected: FilterKey; onSelect: (k: FilterKey) => void
    customFrom: string; customTo: string
    onCustomFromChange: (v: string) => void; onCustomToChange: (v: string) => void
    selectedModule: string; onModuleChange: (v: string) => void
    selectedAdminId: string; onAdminIdChange: (v: string) => void
    adminList: AdminListItem[]
}

function LeftPanel({ selected, onSelect, customFrom, customTo, onCustomFromChange, onCustomToChange, selectedModule, onModuleChange, selectedAdminId, onAdminIdChange, adminList }: LeftPanelProps) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <Filter className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Time Filter</span>
            </div>
            {FILTER_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => onSelect(opt.key)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${selected === opt.key ? "bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"}`}>
                    {opt.label}
                </button>
            ))}
            <div className="mt-4 px-3">
                <button onClick={() => onSelect("custom")}
                    className={`w-full text-left flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3 cursor-pointer transition-colors ${selected === "custom" ? "text-neutral-900 dark:text-white" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"}`}>
                    <Calendar className="h-3.5 w-3.5" />Custom Range
                </button>
                <div className="space-y-2">
                    {[
                        { label: "From", value: customFrom, onChange: (v: string) => { onCustomFromChange(v); onSelect("custom") } },
                        { label: "To", value: customTo, onChange: (v: string) => { onCustomToChange(v); onSelect("custom") } },
                    ].map(({ label, value, onChange }) => (
                        <div key={label}>
                            <label className="text-xs text-neutral-400 block mb-1">{label}</label>
                            <input type="date" value={value} onChange={e => onChange(e.target.value)}
                                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-5 px-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">Module</label>
                <Select value={selectedModule} onValueChange={onModuleChange}>
                    <SelectTrigger className="w-full h-8 text-xs border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">All modules</SelectItem>
                        {MODULE_OPTIONS.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="mt-4 px-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">Admin</label>
                <Select value={selectedAdminId} onValueChange={onAdminIdChange}>
                    <SelectTrigger className="w-full h-8 text-xs border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <SelectValue placeholder="All admins" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">All admins</SelectItem>
                        {adminList.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name ?? a.email ?? a.id}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AuditLogsClient({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
    const [selectedFilter, setSelectedFilter] = useState<FilterKey>("day")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [selectedModule, setSelectedModule] = useState("all")
    const [selectedAdminId, setSelectedAdminId] = useState("all")
    const [logs, setLogs] = useState<AuditLogWithAdmin[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedLog, setSelectedLog] = useState<AuditLogWithAdmin | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [adminList, setAdminList] = useState<AdminListItem[]>([])

    useEffect(() => {
        getAdminList().then(r => { if (r.success) setAdminList(r.data ?? []) })
    }, [])

    const fetchLogs = useCallback(async (filter: FilterKey, from: string, to: string, module: string, adminId: string) => {
        setLoading(true); setError(null)
        try {
            const range = getDateRange(filter, from || undefined, to || undefined)
            const result = await getAuditLogsFiltered({
                ...range, limit: 100,
                module: module !== "all" ? module : undefined,
                adminId: adminId !== "all" ? adminId : undefined,
            })
            if (result.success && result.data) {
                setLogs(result.data.logs); setTotal(result.data.total)
            } else {
                setError(result.error ?? "Failed to load logs"); setLogs([]); setTotal(0)
            }
        } catch { setError("Failed to load logs"); setLogs([]); setTotal(0) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchLogs(selectedFilter, customFrom, customTo, selectedModule, selectedAdminId)
    }, [selectedFilter, customFrom, customTo, selectedModule, selectedAdminId, fetchLogs])

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Audit Logs</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {isSuperAdmin
                            ? "Every admin action across the platform is recorded here."
                            : "Team member actions are visible here."}
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5">
                    <Shield className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">90-day retention</span>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-[220px_1fr] gap-6 items-start">
                <div className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
                    <LeftPanel
                        selected={selectedFilter} onSelect={setSelectedFilter}
                        customFrom={customFrom} customTo={customTo}
                        onCustomFromChange={setCustomFrom} onCustomToChange={setCustomTo}
                        selectedModule={selectedModule} onModuleChange={setSelectedModule}
                        selectedAdminId={selectedAdminId} onAdminIdChange={setSelectedAdminId}
                        adminList={adminList}
                    />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                    {!loading && !error && (
                        <p className="text-xs text-neutral-400">
                            {total.toLocaleString()} {total === 1 ? "entry" : "entries"} found
                        </p>
                    )}
                    {loading && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 flex flex-col items-center justify-center gap-3">
                            <InlineLoader size={24} />
                            <p className="text-sm text-neutral-400">Loading logs...</p>
                        </div>
                    )}
                    {!loading && error && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 text-center">
                            <p className="text-sm text-neutral-500">{error}</p>
                        </div>
                    )}
                    {!loading && !error && logs.length === 0 && (
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 flex flex-col items-center justify-center gap-3">
                            <Activity className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm text-neutral-500">No audit logs for this filter.</p>
                        </div>
                    )}
                    {!loading && !error && logs.length > 0 && (
                        <div className="space-y-2.5">
                            {logs.map(log => (
                                <LogCard key={log.id} log={log} onClick={() => { setSelectedLog(log); setSheetOpen(true) }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <DetailSheet log={selectedLog} open={sheetOpen} onOpenChange={setSheetOpen} />
        </div>
    )
}
