"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, UserCheck, UserX, Mail, Shield, X } from "lucide-react"
import Image from "next/image"
import { getUsers, getUserById, updateUserStatus } from "@/actions/user.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { cn } from "@repo/ui/lib/utils"
import { Sheet, SheetContent } from "@repo/ui/components/ui/sheet"
import { DataTable, type DataTableColumn } from "@repo/ui/components/ui/data-table"
import { useDebounce } from "@repo/ui/hooks/use-debounce"
import { PermissionGate } from "@/components/permission-gate"

type User = {
    id: string
    name: string | null
    email: string
    image: string | null
    role: "USER" | "ADMIN"
    isActive: boolean
    bio?: string | null
    createdAt: Date | string
    updatedAt?: Date | string
}

const PAGE_SIZE = 20

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
            active
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-neutral-400")} />
            {active ? "Active" : "Inactive"}
        </span>
    )
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [total, setTotal] = useState(0)
    const [pages, setPages] = useState(1)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getUsers(page, PAGE_SIZE, debouncedSearch)
        if (res.success && res.data) {
            setUsers(res.data.items as User[])
            setTotal(res.data.total)
            setPages(res.data.pages)
        }
        setLoading(false)
    }, [page, debouncedSearch])

    useEffect(() => { load() }, [load])
    useEffect(() => { setPage(1) }, [debouncedSearch])

    async function handleViewUser(row: User) {
        setDetailLoading(true)
        setSheetOpen(true)
        const res = await getUserById(row.id)
        if (res.success && res.data) setSelectedUser(res.data as User)
        else toast.error("Failed to load user details")
        setDetailLoading(false)
    }

    async function handleToggleStatus(userId: string, current: boolean) {
        setUpdatingId(userId)
        const res = await updateUserStatus(userId, !current)
        if (res.success) {
            toast.success(current ? "User deactivated" : "User activated")
            setUsers(u => u.map(x => x.id === userId ? { ...x, isActive: !current } : x))
            if (selectedUser?.id === userId) setSelectedUser(u => u ? { ...u, isActive: !current } : u)
        } else toast.error(res.error ?? "Failed to update")
        setUpdatingId(null)
    }

    // ── Column definitions (render functions receive the full row) ────────────
    const columns: DataTableColumn<User>[] = [
        {
            key: "user",
            header: "User",
            render: (row) => (
                <div className="flex items-center gap-3">
                    {row.image ? (
                        <Image src={row.image} alt={row.name ?? "User"} width={34} height={34} className="rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold">
                            {(row.name || row.email)[0]?.toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[160px]">{row.name ?? "-"}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[160px]">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "role",
            header: "Role",
            className: "hidden sm:table-cell",
            headerClassName: "hidden sm:table-cell",
            render: (row) => (
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    row.role === "ADMIN"
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                )}>{row.role}</span>
            ),
        },
        {
            key: "isActive",
            header: "Status",
            render: (row) => <StatusBadge active={row.isActive} />,
        },
        {
            key: "createdAt",
            header: "Joined",
            className: "hidden md:table-cell",
            headerClassName: "hidden md:table-cell",
            render: (row) => (
                <span className="text-neutral-500 dark:text-neutral-400">
                    {new Date(row.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ]

    return (
        <PermissionGate module="users" level="read">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                <div>
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                        <Users className="w-4 h-4" /><span>Management</span>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Users</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{total} registered users</p>
                </div>

                {/*
                 * DataTable demo:
                 *   columns     - define what each cell renders
                 *   onRowClick  - caller decides: opens a sheet
                 *   renderRowActions - caller decides: activate/deactivate button
                 *   onSearchChange  - caller debounces + re-fetches
                 *   onPageChange    - caller updates page + re-fetches
                 */}
                <DataTable<User>
                    data={users}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.id}
                    onRowClick={handleViewUser}
                    highlightRowId={sheetOpen ? (selectedUser?.id ?? undefined) : undefined}
                    renderRowActions={(row) => (
                        <button
                            onClick={() => handleToggleStatus(row.id, row.isActive)}
                            disabled={updatingId === row.id}
                            title={row.isActive ? "Deactivate" : "Activate"}
                            className={cn("p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50",
                                row.isActive
                                    ? "hover:bg-red-50 dark:hover:bg-red-500/10 text-neutral-400 hover:text-red-500"
                                    : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-500"
                            )}
                        >
                            {updatingId === row.id
                                ? <InlineLoader size={16} />
                                : row.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />
                            }
                        </button>
                    )}
                    searchValue={search}
                    searchPlaceholder="Search by name or email…"
                    onSearchChange={setSearch}
                    page={page}
                    totalPages={pages}
                    totalItems={total}
                    onPageChange={setPage}
                    emptyTitle="No users found"
                    emptyDescription={debouncedSearch ? `No results for "${debouncedSearch}"` : undefined}
                    emptyIcon={<Users className="w-12 h-12" />}
                />
            </div>

            {/* Detail sheet - opens on row click, caller decides content */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                    {detailLoading ? (
                        <div className="flex items-center justify-center h-full min-h-64"><InlineLoader size={32} /></div>
                    ) : selectedUser ? (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">User Details</h2>
                                <button onClick={() => setSheetOpen(false)} className="cursor-pointer p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 p-6 space-y-6">
                                <div className="flex items-start gap-4">
                                    {selectedUser.image ? (
                                        <Image src={selectedUser.image} alt={selectedUser.name ?? "User"} width={52} height={52} className="rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-lg font-bold">{(selectedUser.name || selectedUser.email)[0]?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white">{selectedUser.name ?? "No name"}</h3>
                                        <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                                selectedUser.role === "ADMIN"
                                                    ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                            )}>
                                                <Shield className="w-3 h-3 mr-1" />{selectedUser.role}
                                            </span>
                                            <StatusBadge active={selectedUser.isActive} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: "User ID", value: selectedUser.id, mono: true },
                                        { label: "Joined", value: new Date(selectedUser.createdAt).toLocaleString() },
                                        ...(selectedUser.updatedAt ? [{ label: "Updated", value: new Date(selectedUser.updatedAt).toLocaleString() }] : []),
                                        ...(selectedUser.bio ? [{ label: "Bio", value: selectedUser.bio }] : []),
                                    ].map(({ label, value, mono }) => (
                                        <div key={label}>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-0.5">{label}</p>
                                            <p className={cn("text-sm text-neutral-900 dark:text-white break-all", mono && "font-mono text-xs text-neutral-500 dark:text-neutral-400")}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400 mb-3">Actions</p>
                                    <button
                                        onClick={() => handleToggleStatus(selectedUser.id, selectedUser.isActive)}
                                        disabled={updatingId === selectedUser.id}
                                        className={cn("inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50",
                                            selectedUser.isActive
                                                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                                                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                        )}
                                    >
                                        {updatingId === selectedUser.id
                                            ? <InlineLoader size={14} />
                                            : selectedUser.isActive
                                                ? <><UserX className="w-4 h-4" /> Deactivate user</>
                                                : <><UserCheck className="w-4 h-4" /> Activate user</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </PermissionGate>
    )
}
