"use client"

import { useState, useEffect } from "react"
import { Settings, Save, Check, RefreshCw, Database } from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { getSystemSettings, updateSystemSetting, getSystemHealth, clearCache } from "@/actions/system.action"
import { toast } from "@repo/ui/components/ui/sonner"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { cn } from "@repo/ui/lib/utils"

const DEFAULT_SETTINGS = [
    { key: "platform_name", label: "Platform Name", description: "The name of your platform shown to users", defaultValue: "My Platform", type: "text" },
    { key: "support_email", label: "Support Email", description: "Email address for user support inquiries", defaultValue: "", type: "email" },
    { key: "max_users", label: "Max Users", description: "Maximum number of users allowed on the platform", defaultValue: "1000", type: "number" },
    { key: "maintenance_mode", label: "Maintenance Mode", description: "Put the platform in maintenance mode (blocks user access)", defaultValue: "false", type: "toggle" },
    { key: "registration_enabled", label: "Registration Enabled", description: "Allow new users to register", defaultValue: "true", type: "toggle" },
    { key: "email_verification_required", label: "Email Verification Required", description: "Require email verification before users can access the platform", defaultValue: "true", type: "toggle" },
]

export default function SystemSettingsPage() {
    const [values, setValues] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
    const [health, setHealth] = useState<{ databaseStatus: string; recentErrors: number } | null>(null)
    const [loadingHealth, setLoadingHealth] = useState(true)
    const [clearingCache, setClearingCache] = useState(false)

    useEffect(() => {
        async function load() {
            const [settingsRes, healthRes] = await Promise.all([
                getSystemSettings(),
                getSystemHealth(),
            ])
            if (settingsRes.success && Array.isArray(settingsRes.data)) {
                const map: Record<string, string> = {}
                for (const s of settingsRes.data as { key: string; value: unknown }[]) {
                    map[s.key] = String(s.value ?? "")
                }
                setValues(map)
            }
            if (healthRes.success && healthRes.data) {
                setHealth(healthRes.data as { databaseStatus: string; recentErrors: number })
            }
            setLoadingHealth(false)
        }
        load()
    }, [])

    async function saveSetting(key: string, defaultValue: string) {
        setSaving(key)
        const value = values[key] ?? defaultValue
        const res = await updateSystemSetting(key, { value })
        setSaving(null)
        if (res.success) {
            setSavedKeys((prev) => new Set([...prev, key]))
            setTimeout(() => setSavedKeys((prev) => { const n = new Set(prev); n.delete(key); return n }), 2000)
            toast.success("Setting saved")
        } else {
            toast.error(res.error || "Failed to save setting")
        }
    }

    async function handleClearCache() {
        setClearingCache(true)
        const res = await clearCache()
        setClearingCache(false)
        if (res.success) {
            toast.success("Cache cleared successfully")
        } else {
            toast.error(res.error || "Failed to clear cache")
        }
    }

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm mb-1">
                    <Settings className="w-4 h-4" />
                    <span>System</span>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">System Settings</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Global platform configuration</p>
            </div>

            {/* System health */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-neutral-500" />
                        System Health
                    </h2>
                    <button
                        onClick={handleClearCache}
                        disabled={clearingCache}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                        {clearingCache ? <DotmSquare11 size={14} dotSize={2} speed={1.2} /> : <RefreshCw className="w-4 h-4" />}
                        Clear Cache
                    </button>
                </div>
                {loadingHealth ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-2">Database</p>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    health?.databaseStatus === "healthy" ? "bg-emerald-500" : "bg-red-500"
                                )} />
                                <span className="text-sm font-medium text-neutral-900 dark:text-white capitalize">
                                    {health?.databaseStatus ?? "Unknown"}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-2">Recent Errors</p>
                            <span className={cn(
                                "text-2xl font-bold",
                                (health?.recentErrors ?? 0) > 0 ? "text-red-500" : "text-emerald-500"
                            )}>
                                {health?.recentErrors ?? 0}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings form */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6">
                <h2 className="font-semibold text-neutral-900 dark:text-white">Platform Configuration</h2>
                {DEFAULT_SETTINGS.map((setting) => (
                    <div key={setting.key} className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="sm:flex-1">
                            <Label className="text-sm font-medium text-neutral-900 dark:text-white">{setting.label}</Label>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{setting.description}</p>
                        </div>
                        <div className="flex items-center gap-2 sm:w-64">
                            {setting.type === "toggle" ? (
                                <button
                                    onClick={() => {
                                        const current = values[setting.key] ?? setting.defaultValue
                                        setValues((prev) => ({ ...prev, [setting.key]: current === "true" ? "false" : "true" }))
                                    }}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        (values[setting.key] ?? setting.defaultValue) === "true"
                                            ? "bg-emerald-500"
                                            : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                                        (values[setting.key] ?? setting.defaultValue) === "true" ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            ) : (
                                <Input
                                    type={setting.type}
                                    value={values[setting.key] ?? setting.defaultValue}
                                    onChange={(e) => setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                                    className="h-9 text-sm flex-1"
                                />
                            )}
                            <button
                                onClick={() => saveSetting(setting.key, setting.defaultValue)}
                                disabled={saving === setting.key}
                                className={cn(
                                    "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                    savedKeys.has(setting.key)
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600"
                                )}
                            >
                                {saving === setting.key ? (
                                    <DotmSquare11 size={14} dotSize={2} speed={1.2} />
                                ) : savedKeys.has(setting.key) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
