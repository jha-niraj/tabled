"use client"

import { useEffect, useState, useRef } from "react"
import {
    getCurrentAdmin, changeAdminPassword, updateAdminAvatar
} from "@/actions/admin.action"
import { getSignedUploadParams } from "@/actions/cloudinary.action"
import {
    Shield, BadgeCheck, KeyRound, Mail, User, Lock, Eye, EyeOff, Camera
} from "lucide-react"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { toast } from "@repo/ui/components/ui/sonner"
import type { AdminUser } from "@/types/admin"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { cn } from "@repo/ui/lib/utils"
import { defaultPermissionsByRole } from "@/lib/navigation"
import Image from "next/image"
import { useAdminProfileStore } from "@/stores/admin-profile.store"

type Tab = "overview" | "permissions" | "security"

const TABS: { value: Tab; label: string; icon: typeof User }[] = [
    { value: "overview", label: "Overview", icon: User },
    { value: "permissions", label: "Permissions", icon: BadgeCheck },
    { value: "security", label: "Security", icon: Lock },
]

const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    TEAM_MEMBER: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
}

async function uploadToCloudinary(file: File): Promise<string> {
    // Signed upload - no unsigned preset required. Server generates the signature.
    const params = await getSignedUploadParams("admin-avatars")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("api_key", params.apiKey)
    formData.append("timestamp", String(params.timestamp))
    formData.append("signature", params.signature)
    formData.append("folder", params.folder)
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
        { method: "POST", body: formData },
    )
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as {error?: {message?: string}}).error?.message || "Upload failed")
    }
    const data = await res.json()
    return data.secure_url as string
}

export default function AdminProfilePage() {
    const [admin, setAdmin] = useState<AdminUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>("overview")
    const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [changing, setChanging] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const setStoreAvatarUrl = useAdminProfileStore((s) => s.setAvatarUrl)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getCurrentAdmin().then((res) => {
            if (res.success && res.data) {
                setAdmin(res.data)
                setAvatarUrl(res.data.image ?? null)
            } else {
                toast.error(res.error || "Failed to load profile")
            }
            setLoading(false)
        })
    }, [])

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be smaller than 5 MB"); return }
        setUploadingAvatar(true)
        try {
            const url = await uploadToCloudinary(file)
            const res = await updateAdminAvatar(url)
            if (res.success) {
                setAvatarUrl(url)
                setStoreAvatarUrl(url)  // sync to Zustand so sidebar updates instantly
                toast.success("Profile picture updated")
            } else {
                toast.error(res.error ?? "Failed to update avatar")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        if (!pwd.current || !pwd.next) return toast.error("Please fill all fields")
        if (pwd.next.length < 8) return toast.error("New password must be at least 8 characters")
        if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match")
        setChanging(true)
        const res = await changeAdminPassword(pwd.current, pwd.next)
        setChanging(false)
        if (res.success) {
            toast.success("Password changed successfully")
            setPwd({ current: "", next: "", confirm: "" })
        } else {
            toast.error(res.error || "Failed to change password")
        }
    }

    // For the permissions tab: SUPER_ADMIN shows defaultPermissionsByRole, others show actual permissions
    const displayPermissions: Record<string, string[]> = admin?.role === "SUPER_ADMIN"
        ? (defaultPermissionsByRole["SUPER_ADMIN"] ?? {})
        : (admin?.permissions ?? {})

    const initials = (admin?.name || admin?.email || "A")[0]?.toUpperCase() ?? "A"

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <InlineLoader size={32} />
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                    <Shield className="w-4 h-4" />
                    <span>System</span>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">My Profile</h1>
            </div>

            {/* Profile card with avatar upload */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                <div className="flex items-center gap-5">
                    {/* Clickable avatar */}
                    <div className="relative flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="relative w-16 h-16 rounded-2xl cursor-pointer block"
                            title="Change profile picture"
                        >
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={admin?.name ?? "Admin"}
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                                    {initials}
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div
                                className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                style={{ opacity: uploadingAvatar ? 1 : undefined }}
                            >
                                {uploadingAvatar
                                    ? <InlineLoader size={18} />
                                    : <Camera className="w-5 h-5 text-white" />
                                }
                            </div>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{admin?.name || "Admin"}</h2>
                        <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{admin?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", ROLE_COLORS[admin?.role ?? "TEAM_MEMBER"])}>
                                <Shield className="w-3 h-3" />
                                {admin?.role?.replace(/_/g, " ")}
                            </span>
                            <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                admin?.status === "ACTIVE"
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                            )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1", admin?.status === "ACTIVE" ? "bg-emerald-500" : "bg-neutral-400")} />
                                {admin?.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                            Click avatar to change photo
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative cursor-pointer",
                            activeTab === tab.value
                                ? "text-neutral-900 dark:text-white"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.value && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Overview tab — removed loginCount */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: "Member Since", value: admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "-" },
                        { label: "Last Login", value: admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never" },
                        { label: "User ID", value: admin?.userId ?? "-" },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-1">{item.label}</p>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white font-mono">{item.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Permissions tab — shows defaultPermissions for SUPER_ADMIN */}
            {activeTab === "permissions" && (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {admin?.role === "SUPER_ADMIN"
                            ? "Super Admin has full access to all modules."
                            : "Your assigned permissions across modules."}
                    </p>
                    {Object.keys(displayPermissions).length === 0 ? (
                        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
                            <BadgeCheck className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                            <p className="text-neutral-500 dark:text-neutral-400">No permissions assigned yet</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                A super admin can assign permissions via Access Control.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(displayPermissions).map(([mod, levels]) => (
                                <div key={mod} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-neutral-900 dark:text-white capitalize text-sm">
                                            {mod.replace(/_/g, " ")}
                                        </span>
                                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(levels as string[]).map((lvl) => (
                                            <span key={lvl} className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                                                {lvl}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Security tab */}
            {activeTab === "security" && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                    <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
                        <KeyRound className="w-5 h-5" />
                        Change Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                        <div className="space-y-2">
                            <Label className="text-sm text-neutral-700 dark:text-neutral-300">Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? "text" : "password"}
                                    value={pwd.current}
                                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                                    placeholder="Enter current password"
                                    className="pr-10"
                                    required
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-neutral-700 dark:text-neutral-300">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? "text" : "password"}
                                    value={pwd.next}
                                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                                    placeholder="At least 8 characters"
                                    className="pr-10"
                                    required
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-neutral-700 dark:text-neutral-300">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={pwd.confirm}
                                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                                placeholder="Re-enter new password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={changing}
                            className="cursor-pointer w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {changing ? <><DotmSquare11 size={14} dotSize={2} speed={1.2} /> Saving...</> : "Change Password"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
