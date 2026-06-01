"use client"

import { useState, useEffect } from "react"
import {
    Shield, UserPlus, Mail, Copy, Trash2, Settings
} from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { PermissionGate } from "@/components/permission-gate"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "@repo/ui/components/ui/sonner"
import {
    getAdminUsers, getPendingInvitations, createAdminInvitation, revokeInvitation
} from "@/actions/admin.action"
import type { AdminUser } from "@/types/admin"
import { Label } from "@repo/ui/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@repo/ui/components/ui/select"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@repo/ui/components/ui/sheet"

type AdminRole = "SUPER_ADMIN" | "TEAM_MEMBER"

const roleColors: Record<AdminRole, string> = {
    SUPER_ADMIN: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    TEAM_MEMBER: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

interface AdminInvitation {
    id: string
    email: string
    code: string
    adminRole: AdminRole
    status: string
    expiresAt: string
}

export default function AdminManagementPage() {
    const [activeTab, setActiveTab] = useState<"admins" | "invitations">("admins")
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState<AdminRole>("TEAM_MEMBER")
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [invitations, setInvitations] = useState<AdminInvitation[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [adminsRes, invitesRes] = await Promise.all([
                getAdminUsers(),
                getPendingInvitations()
            ])

            if (adminsRes.success) setAdmins(adminsRes.data || [])
            if (invitesRes.success) setInvitations(invitesRes.data || [])
        } catch (error) {
            console.error("Load data error:", error)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateInvitation() {
        if (!inviteEmail) {
            toast.error("Please enter an email address")
            return
        }

        setSubmitting(true)
        try {
            const result = await createAdminInvitation({
                email: inviteEmail,
                adminRole: inviteRole,
            })

            if (result.success) {
                toast.success("Invitation created!", {
                    description: `Access code sent to ${inviteEmail}`
                })
                setShowInviteModal(false)
                setInviteEmail("")
                setInviteRole("TEAM_MEMBER")
                loadData()
            } else {
                toast.error(result.error || "Failed to create invitation")
            }
        } catch (error) {
            console.error("Create invitation error:", error)
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    async function handleRevokeInvitation(invitationId: string) {
        try {
            const result = await revokeInvitation(invitationId)
            if (result.success) {
                toast.success("Invitation revoked")
                loadData()
            } else {
                toast.error(result.error || "Failed to revoke invitation")
            }
        } catch (error) {
            console.error("Revoke error:", error)
            toast.error("An error occurred")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard!")
    }

    return (
        <>
        <PermissionGate module="admin_management" level="read">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-7 h-7" />
                        Admin Management
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Manage administrators and their access permissions
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Admin
                </button>
            </div>
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6">
                <button
                    onClick={() => setActiveTab("admins")}
                    className={cn(
                        "px-6 py-3 text-sm font-medium transition-colors relative",
                        activeTab === "admins"
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    Active Admins ({admins.length})
                    {
                        activeTab === "admins" && (
                            <motion.div
                                layoutId="adminTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500"
                            />
                        )
                    }
                </button>
                <button
                    onClick={() => setActiveTab("invitations")}
                    className={cn(
                        "px-6 py-3 text-sm font-medium transition-colors relative",
                        activeTab === "invitations"
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                    )}
                >
                    Pending Invitations ({invitations.length})
                    {
                        activeTab === "invitations" && (
                            <motion.div
                                layoutId="adminTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500"
                            />
                        )
                    }
                </button>
            </div>
            {
                activeTab === "admins" && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        {
                            loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <InlineLoader size={32} />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Admin</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Last Login</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Joined</th>
                                                <th className="text-left p-4 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                admins.map((admin) => (
                                                    <tr
                                                        key={admin.id}
                                                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                                                    <span className="text-white font-bold">{(admin.name || admin.email || "A")[0]}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-neutral-900 dark:text-white">{admin.name || "Unknown"}</p>
                                                                    <p className="text-sm text-neutral-500">{admin.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                                                roleColors[admin.role as AdminRole]
                                                            )}>
                                                                <Shield className="w-3 h-3" />
                                                                {admin.role.replace(/_/g, " ")}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                                                admin.status === "ACTIVE"
                                                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                                                            )}>
                                                                <span className={cn(
                                                                    "w-1.5 h-1.5 rounded-full mr-1.5",
                                                                    admin.status === "ACTIVE" ? "bg-emerald-500" : "bg-neutral-400"
                                                                )} />
                                                                {admin.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-neutral-500">
                                                            {
                                                                admin.lastLoginAt
                                                                    ? new Date(admin.lastLoginAt).toLocaleString()
                                                                    : "Never"
                                                            }
                                                        </td>
                                                        <td className="p-4 text-sm text-neutral-500">
                                                            {new Date(admin.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4">
                                                            <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                                                <Settings className="w-4 h-4 text-neutral-500" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )
                        }
                    </div>
                )
            }

            {
                activeTab === "invitations" && (
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        {
                            loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <InlineLoader size={32} />
                                </div>
                            ) : invitations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Mail className="w-12 h-12 text-neutral-400 mb-4" />
                                    <p className="text-neutral-500 dark:text-neutral-400">No pending invitations</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Email</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Access Code</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                                                <th className="text-left p-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Expires</th>
                                                <th className="text-left p-4 w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                invitations.map((invite) => (
                                                    <tr
                                                        key={invite.id}
                                                        className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                                                    >
                                                        <td className="p-4">
                                                            <p className="font-medium text-neutral-900 dark:text-white">{invite.email}</p>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <code className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm font-mono">
                                                                    {invite.code}
                                                                </code>
                                                                <button
                                                                    onClick={() => copyToClipboard(invite.code)}
                                                                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                >
                                                                    <Copy className="w-4 h-4 text-neutral-500" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                                                                roleColors[invite.adminRole as AdminRole]
                                                            )}>
                                                                {invite.adminRole.replace(/_/g, " ")}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                                                {
                                                                    "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400": invite.status === "PENDING",
                                                                    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400": invite.status === "USED",
                                                                    "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400": invite.status === "EXPIRED",
                                                                }
                                                            )}>
                                                                {invite.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-neutral-500">
                                                            {new Date(invite.expiresAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleRevokeInvitation(invite.id)}
                                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                    title="Revoke"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )
                        }
                    </div>
                )
            }

        </div>
        </PermissionGate>

        {/* Invite sheet - from the right */}
        <Sheet open={showInviteModal} onOpenChange={setShowInviteModal}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-0">
                <div className="flex flex-col h-full">
                    <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                        <SheetTitle className="text-lg font-bold text-neutral-900 dark:text-white">Invite New Admin</SheetTitle>
                        <SheetDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                            An invitation link will be sent to their email address.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="admin@example.com"
                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Role
                            </Label>
                            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as AdminRole)}>
                                <SelectTrigger className="w-full bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:ring-red-500/20 focus:border-red-500">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                    <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                The invitee will receive an email with a secure link to set their password and join the admin panel.
                                The link expires in 7 days.
                            </p>
                        </div>
                    </div>
                    <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="cursor-pointer flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateInvitation}
                            disabled={submitting}
                            className="cursor-pointer flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><DotmSquare11 size={14} dotSize={2} speed={1.2} />Sending...</>
                            ) : "Send Invitation"}
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
        </>
    )
}