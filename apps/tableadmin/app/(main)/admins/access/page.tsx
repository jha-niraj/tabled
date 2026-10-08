"use client"

import { useEffect, useState } from "react"
import { getAdminUsers, updateAdminPermissions, updateAdminStatus } from "@/actions/admin.action"
import { Shield, Check, X, Settings } from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { toast } from "@repo/ui/components/ui/sonner"
import { cn } from "@repo/ui/lib/utils"
import { roleColors } from "@/types/admin"
import { formatAdminRole } from "@/lib/role-labels"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog"
import { PermissionGate } from "@/components/permission-gate"

const MODULE_KEYS = [
    "dashboard", "users", "analytics", "reports", "communications",
    "admin_management", "system",
] as const

const LEVELS = ["read", "write", "delete", "full"] as const
type Level = typeof LEVELS[number]
type ModuleKey = typeof MODULE_KEYS[number]

type AdminRow = {
    id: string
    user: { id: string; name: string | null; email: string | null }
    adminRole: string
    status: string
    permissions: Record<string, Level[]>
}

function getInitials(name: string | null, email: string | null): string {
    if (name) return name.slice(0, 2).toUpperCase()
    if (email) return email.slice(0, 2).toUpperCase()
    return "AD"
}

const GRADIENT_BY_ROLE: Record<string, string> = {
    SUPER_ADMIN: "from-red-500 to-orange-500",
    TEAM_MEMBER: "from-blue-500 to-cyan-500",
}

type PendingAction = { type: "save" | "status"; statusValue?: "ACTIVE" | "INACTIVE" | "SUSPENDED" } | null

export default function AdminAccessPage() {
    const [admins, setAdmins] = useState<AdminRow[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedIdx, setSelectedIdx] = useState(0)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [pendingAction, setPendingAction] = useState<PendingAction>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => { load() }, [])

    async function load() {
        setLoading(true)
        const res = await getAdminUsers()
        setLoading(false)
        if (!res.success) { toast.error(res.error || "Failed to fetch admins"); return }
        const rows = (res.data || []).map((a: AdminRow) => ({
            id: a.id, user: a.user, adminRole: a.adminRole, status: a.status, permissions: a.permissions || {}
        }))
        setAdmins(rows)
        setSelectedIdx(0)
    }

    function togglePerm(moduleKey: ModuleKey, level: Level) {
        setAdmins(prev => prev.map((a, i) => {
            if (i !== selectedIdx) return a
            const current = new Set(a.permissions[moduleKey] || [])
            if (current.has(level)) current.delete(level); else current.add(level)
            return { ...a, permissions: { ...a.permissions, [moduleKey]: Array.from(current) as Level[] } }
        }))
    }

    async function executeSave() {
        const row = admins[selectedIdx]
        if (!row) return
        setSavingId(row.id)
        const res = await updateAdminPermissions(row.id, row.permissions)
        setSavingId(null)
        if (res.success) toast.success("Permissions updated")
        else toast.error(res.error || "Failed to update")
    }

    async function executeSetStatus(status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
        const row = admins[selectedIdx]
        if (!row) return
        setSavingId(row.id)
        const res = await updateAdminStatus(row.id, status)
        setSavingId(null)
        if (res.success) { toast.success("Status updated"); load() }
        else toast.error(res.error || "Failed to update status")
    }

    async function handleDialogConfirm() {
        setDialogOpen(false)
        if (!pendingAction) return
        if (pendingAction.type === "save") await executeSave()
        else if (pendingAction.type === "status" && pendingAction.statusValue) await executeSetStatus(pendingAction.statusValue)
        setPendingAction(null)
    }

    const selected = admins[selectedIdx]
    const pendingAdminName = selected?.user?.name || selected?.user?.email || "this admin"
    const dialogTitle = pendingAction?.type === "save" ? "Save Permission Changes" : `Change Status to ${pendingAction?.statusValue ?? ""}`
    const dialogDescription = pendingAction?.type === "save" ? `Save permission changes for ${pendingAdminName}?` : `Change ${pendingAdminName}'s status to ${pendingAction?.statusValue ?? ""}?`
    const confirmBtnClass = pendingAction?.type === "status" && pendingAction.statusValue === "SUSPENDED"
        ? "bg-red-600 text-white hover:bg-red-700"
        : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"

    return (
        <PermissionGate module="admin_management" level="write">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-7 h-7" />Access Control
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Edit admin permissions across modules.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <DotmSquare11 size={32} dotSize={3} speed={1.5} />
                    </div>
                ) : admins.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                        <p className="text-sm text-neutral-500">No admins found.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Admin selector tabs */}
                        <div className="overflow-x-auto pb-2">
                            <div className="flex gap-2 min-w-max">
                                {admins.map((a, idx) => {
                                    const gradient = GRADIENT_BY_ROLE[a.adminRole] || "from-neutral-400 to-neutral-500"
                                    const isSelected = idx === selectedIdx
                                    return (
                                        <button key={a.id} onClick={() => setSelectedIdx(idx)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-neutral-900 dark:bg-white border-transparent text-white dark:text-neutral-900"
                                                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700"
                                            )}>
                                            <div className={cn("w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold flex-shrink-0", gradient)}>
                                                {getInitials(a.user?.name, a.user?.email)}
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-sm font-medium truncate max-w-[120px]">{a.user?.name || a.user?.email || "Admin"}</p>
                                                <p className={cn("text-[10px] font-medium truncate max-w-[120px]", isSelected ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400")}>
                                                    {formatAdminRole(a.adminRole)}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Selected admin permissions */}
                        {selected && (
                            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
                                {/* Header */}
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold", GRADIENT_BY_ROLE[selected.adminRole] || "from-neutral-400 to-neutral-500")}>
                                            {getInitials(selected.user?.name, selected.user?.email)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-white">{selected.user?.name || "Unknown"}</p>
                                            <p className="text-sm text-neutral-500">{selected.user?.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", roleColors[selected.adminRole] || roleColors["TEAM_MEMBER"])}>
                                                    <Shield className="w-3 h-3" />
                                                    {formatAdminRole(selected.adminRole)}
                                                </span>
                                                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                                                    selected.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                        : selected.status === "SUSPENDED" ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                                )}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full",
                                                        selected.status === "ACTIVE" ? "bg-emerald-500" : selected.status === "SUSPENDED" ? "bg-red-500" : "bg-neutral-400"
                                                    )} />
                                                    {selected.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { setPendingAction({ type: "status", statusValue: "ACTIVE" }); setDialogOpen(true) }} disabled={savingId === selected.id}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white cursor-pointer disabled:opacity-50">Activate</button>
                                        <button onClick={() => { setPendingAction({ type: "status", statusValue: "INACTIVE" }); setDialogOpen(true) }} disabled={savingId === selected.id}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 cursor-pointer disabled:opacity-50">Inactive</button>
                                        <button onClick={() => { setPendingAction({ type: "status", statusValue: "SUSPENDED" }); setDialogOpen(true) }} disabled={savingId === selected.id}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50">Suspend</button>
                                    </div>
                                </div>

                                {/* Permission matrix */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                                                <th className="text-left p-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Module</th>
                                                {LEVELS.map(l => (
                                                    <th key={l} className="text-center p-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 capitalize">{l}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MODULE_KEYS.map(key => (
                                                <tr key={key} className="border-t border-neutral-100 dark:border-neutral-800">
                                                    <td className="p-3 capitalize text-neutral-800 dark:text-neutral-200 font-medium">
                                                        {key.replace(/_/g, " ")}
                                                    </td>
                                                    {LEVELS.map(lvl => {
                                                        const checked = (selected.permissions[key] || []).includes(lvl)
                                                        return (
                                                            <td key={lvl} className="p-3 text-center">
                                                                <button onClick={() => togglePerm(key, lvl)}
                                                                    className={cn("inline-flex items-center justify-center w-8 h-8 rounded-md border cursor-pointer transition-colors",
                                                                        checked
                                                                            ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600"
                                                                            : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300"
                                                                    )} aria-pressed={checked}>
                                                                    {checked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                                </button>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <button onClick={() => { setPendingAction({ type: "save" }); setDialogOpen(true) }} disabled={savingId === selected.id}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-50 cursor-pointer">
                                        {savingId === selected.id
                                            ? <><DotmSquare11 size={16} dotSize={2} speed={1.5} />Saving...</>
                                            : <><Settings className="w-4 h-4" />Save Changes</>
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => { setDialogOpen(false); setPendingAction(null) }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDialogConfirm} className={confirmBtnClass}>Confirm</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGate>
    )
}
