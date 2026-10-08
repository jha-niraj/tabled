"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    Bell, Plus, Trash2, AlertCircle, Globe, X,
    Wrench, Sparkles, FileText, Newspaper,
    ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon,
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/select"
import { Label } from "@repo/ui/components/ui/label"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "@repo/ui/components/ui/sonner"
import {
    createPlatformAnnouncement, deletePlatformAnnouncement,
    type PlatformAnnouncement, type AnnouncementType, type AnnouncementPriority,
} from "@/actions/announcements.action"

// ─── Config maps ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; icon: React.ElementType; badgeClass: string; dotClass: string }> = {
    MAINTENANCE:     { label: "Maintenance",    icon: Wrench,    badgeClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",   dotClass: "bg-amber-500" },
    FEATURE_RELEASE: { label: "Feature Release",icon: Sparkles,  badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",     dotClass: "bg-blue-500" },
    POLICY_CHANGE:   { label: "Policy Change",  icon: FileText,  badgeClass: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",dotClass: "bg-purple-500" },
    PLATFORM_NEWS:   { label: "Platform News",  icon: Newspaper, badgeClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",  dotClass: "bg-green-500" },
}

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; badgeClass: string }> = {
    NORMAL: { label: "Normal", badgeClass: "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400" },
    HIGH:   { label: "High",   badgeClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
    URGENT: { label: "Urgent", badgeClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
}

function fmtDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface Props {
    announcements: PlatformAnnouncement[]
    total: number
    totalPages: number
    currentPage: number
    error?: string
}

export function AnnouncementsClient({ announcements, total, totalPages, currentPage, error }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // panelMode: null=closed, 'compose'=new, string=announcement id
    const [panelMode, setPanelMode] = useState<"compose" | string | null>(null)
    const panelOpen = panelMode !== null
    const selectedAnnouncement = panelMode && panelMode !== "compose"
        ? announcements.find(a => a.id === panelMode) ?? null : null

    const [formError, setFormError] = useState<string | null>(null)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [announcementType, setAnnouncementType] = useState<AnnouncementType>("PLATFORM_NEWS")
    const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL")
    const [targetAudience, setTargetAudience] = useState("")

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const resetForm = () => {
        setTitle(""); setContent(""); setAnnouncementType("PLATFORM_NEWS")
        setPriority("NORMAL"); setTargetAudience(""); setFormError(null)
    }

    const openCompose = () => { resetForm(); setPanelMode("compose") }
    const closePanel = () => { setPanelMode(null); resetForm(); setConfirmDeleteId(null) }

    const handleCreate = () => {
        if (!title.trim()) { setFormError("Title is required."); return }
        if (!content.trim()) { setFormError("Message body is required."); return }
        setFormError(null)
        startTransition(async () => {
            const result = await createPlatformAnnouncement({
                title: title.trim(), content: content.trim(),
                announcementType, priority,
                targetAudience: targetAudience.trim() || null,
            })
            if (!result.success) { setFormError(result.error ?? "Failed to create."); return }
            toast.success("Announcement sent", { description: `"${title.trim()}" has been published.` })
            resetForm(); closePanel(); router.refresh()
        })
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const result = await deletePlatformAnnouncement(id)
            if (!result.success) { toast.error("Failed to delete announcement"); return }
            setConfirmDeleteId(null)
            if (panelMode === id) closePanel()
            toast.success("Announcement deleted"); router.refresh()
        } finally { setDeletingId(null) }
    }

    const recentCount = announcements.filter(a => {
        const ago = new Date(); ago.setDate(ago.getDate() - 7)
        return new Date(a.createdAt) >= ago
    }).length
    const urgentCount = announcements.filter(a => a.priority === "URGENT").length

    if (error) return (
        <div className="p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
            <p className="font-medium">Error loading announcements</p><p className="text-sm mt-1">{error}</p>
        </div>
    )

    return (
        <div className="flex items-start overflow-hidden">
            {/* LEFT — list */}
            <div className={cn("shrink-0 sticky top-0 self-start px-4 sm:px-6 lg:px-8 py-6 space-y-5 transition-all duration-300 ease-in-out", panelOpen ? "w-1/2" : "w-full")}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                            <Bell className="w-7 h-7 text-orange-500" /> Platform Announcements
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            Broadcast updates about maintenance, releases, and policy changes ({total} total)
                        </p>
                    </div>
                    {!panelOpen && (
                        <Button onClick={openCompose}
                            className="flex items-center gap-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                            <Plus className="w-4 h-4" /> New Announcement
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className={cn("grid gap-4 transition-all duration-300", panelOpen ? "grid-cols-2" : "grid-cols-3")}>
                    {[
                        { icon: Bell, label: "Total Sent", value: total, bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-600 dark:text-orange-400" },
                        { icon: Sparkles, label: "Last 7 Days", value: recentCount, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400" },
                        ...(!panelOpen ? [{ icon: AlertCircle, label: "Urgent", value: urgentCount, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-600 dark:text-red-400" }] : []),
                    ].map(({ icon: Icon, label, value, bg, color }) => (
                        <div key={label} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                            <div><p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p></div>
                        </div>
                    ))}
                </div>

                {/* Announcements table */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                    {announcements.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                                <Bell className="w-8 h-8 text-orange-500 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900 dark:text-white">No announcements yet</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                                    Send your first announcement to notify users about maintenance windows, new features, or policy changes.
                                </p>
                            </div>
                            <Button onClick={openCompose} variant="outline" className="rounded-full">
                                <Plus className="w-4 h-4 mr-2" /> Create First Announcement
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!panelOpen && (
                                <div className="hidden md:grid grid-cols-[1fr_140px_90px_160px_80px] gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                                    {["Announcement","Type","Priority","Audience","Date"].map(h => (
                                        <span key={h} className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{h}</span>
                                    ))}
                                </div>
                            )}
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {announcements.map((a) => {
                                    const typeCfg = TYPE_CONFIG[a.announcementType] ?? TYPE_CONFIG.PLATFORM_NEWS
                                    const priorityCfg = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.NORMAL
                                    const TypeIcon = typeCfg.icon
                                    const isSel = panelMode === a.id
                                    return (
                                        <div key={a.id} onClick={() => setPanelMode(isSel ? null : a.id)}
                                            className={cn("px-5 py-4 transition-colors cursor-pointer",
                                                isSel ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}>
                                            {/* Mobile */}
                                            <div className="md:hidden space-y-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex-1">{a.title}</h3>
                                                    <ChevronRightIcon className={cn("w-4 h-4 flex-shrink-0 text-neutral-400 transition-all", isSel && "rotate-90")} />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", typeCfg.badgeClass)}>
                                                        <TypeIcon className="w-3 h-3" />{typeCfg.label}
                                                    </span>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", priorityCfg.badgeClass)}>{priorityCfg.label}</span>
                                                    <span className="text-xs text-neutral-400">{fmtDate(a.createdAt)}</span>
                                                </div>
                                            </div>
                                            {/* Desktop */}
                                            {!panelOpen ? (
                                                <div className="hidden md:grid grid-cols-[1fr_140px_90px_160px_80px] gap-4 items-center">
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{a.title}</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{a.content}</p>
                                                    </div>
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit", typeCfg.badgeClass)}>
                                                        <TypeIcon className="w-3 h-3" />{typeCfg.label}
                                                    </span>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit", priorityCfg.badgeClass)}>{priorityCfg.label}</span>
                                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 min-w-0">
                                                        <Globe className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                                                        <span className="truncate">{a.targetAudience ?? "All Users"}</span>
                                                    </div>
                                                    <span className="text-xs text-neutral-400">{fmtDate(a.createdAt)}</span>
                                                </div>
                                            ) : (
                                                <div className="hidden md:flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{a.title}</h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", typeCfg.badgeClass)}>
                                                                <TypeIcon className="w-3 h-3" />{typeCfg.label}
                                                            </span>
                                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", priorityCfg.badgeClass)}>{priorityCfg.label}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRightIcon className={cn("w-4 h-4 flex-shrink-0 text-neutral-400 transition-all", isSel && "rotate-90")} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Page {currentPage} of {totalPages}</p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/communications/announcements?page=${currentPage - 1}`)} disabled={currentPage <= 1}><ChevronLeft className="w-4 h-4" /></Button>
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/communications/announcements?page=${currentPage + 1}`)} disabled={currentPage >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT — compose or detail */}
            <div className={cn("transition-all duration-300 ease-in-out overflow-hidden border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950",
                panelOpen ? "w-1/2 opacity-100" : "w-0 opacity-0 pointer-events-none")}
                style={{ height: panelOpen ? "calc(100vh - 1.5rem)" : 0 }}>
                <div className="flex flex-col h-full">
                    {panelMode === "compose" ? (
                        <>
                            <div className="flex-none bg-white dark:bg-neutral-950 flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div><h2 className="text-base font-semibold text-neutral-900 dark:text-white">New Announcement</h2>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Send a platform announcement to your users.</p></div>
                                <button type="button" onClick={closePanel} className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4 text-neutral-500" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                {formError && (
                                    <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{formError}
                                    </div>
                                )}
                                <div className="space-y-1.5"><Label>Title <span className="text-red-500">*</span></Label><Input placeholder="e.g. Scheduled maintenance on Sunday" value={title} onChange={e => setTitle(e.target.value)} /></div>
                                <div className="space-y-1.5"><Label>Message Body <span className="text-red-500">*</span></Label><RichTextEditor value={content} onChange={setContent} placeholder="Describe the update, maintenance window, or change in detail..." minHeight="260px" maxHeight="320px" /></div>
                                <div className="space-y-1.5">
                                    <Label>Type <span className="text-red-500">*</span></Label>
                                    <Select value={announcementType} onValueChange={v => setAnnouncementType(v as AnnouncementType)}>
                                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent>
                                            {(Object.entries(TYPE_CONFIG) as [AnnouncementType, typeof TYPE_CONFIG[AnnouncementType]][]).map(([value, cfg]) => (
                                                <SelectItem key={value} value={value}>
                                                    <span className="flex items-center gap-2"><span className={cn("inline-block w-2 h-2 rounded-full", cfg.dotClass)} />{cfg.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Priority</Label>
                                    <Select value={priority} onValueChange={v => setPriority(v as AnnouncementPriority)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {(["NORMAL","HIGH","URGENT"] as AnnouncementPriority[]).map(p => (
                                                <SelectItem key={p} value={p}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={cn("inline-block w-2 h-2 rounded-full", p === "NORMAL" ? "bg-neutral-400" : p === "HIGH" ? "bg-orange-500" : "bg-red-500")} />
                                                        {PRIORITY_CONFIG[p].label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Target Audience (optional)</Label>
                                    <Input placeholder="e.g. All users, Premium subscribers, Admins..." value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">Descriptive note only - wire up actual targeting per product.</p>
                                </div>
                            </div>
                            <div className="flex-none px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                                <Button variant="outline" onClick={closePanel} disabled={isPending}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isPending}
                                    className="bg-neutral-900 text-white rounded-full hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 min-w-[140px]">
                                    {isPending ? "Sending..." : "Send Announcement"}
                                </Button>
                            </div>
                        </>
                    ) : selectedAnnouncement ? (
                        <>
                            {/* Detail view */}
                            <div className="flex-none bg-white dark:bg-neutral-950 flex items-start justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {(() => {
                                            const typeCfg = TYPE_CONFIG[selectedAnnouncement.announcementType] ?? TYPE_CONFIG.PLATFORM_NEWS
                                            const priorityCfg = PRIORITY_CONFIG[selectedAnnouncement.priority] ?? PRIORITY_CONFIG.NORMAL
                                            const TypeIcon = typeCfg.icon
                                            return (
                                                <>
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", typeCfg.badgeClass)}>
                                                        <TypeIcon className="w-3 h-3" />{typeCfg.label}
                                                    </span>
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", priorityCfg.badgeClass)}>{priorityCfg.label}</span>
                                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">{fmtDate(selectedAnnouncement.createdAt)}</span>
                                                </>
                                            )
                                        })()}
                                    </div>
                                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white leading-tight">{selectedAnnouncement.title}</h2>
                                </div>
                                <button type="button" onClick={closePanel} className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ml-3 flex-shrink-0"><X className="w-4 h-4 text-neutral-500" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">Message</p>
                                    <div className="rich-editor-content border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 p-4 text-sm text-neutral-700 dark:text-neutral-300"
                                         dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }} />
                                </div>
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Target Audience</span>
                                        <span className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-neutral-400" />{selectedAnnouncement.targetAudience ?? "All Users"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                                        <span className="font-medium text-neutral-900 dark:text-white">{selectedAnnouncement.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-none px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                                {confirmDeleteId === selectedAnnouncement.id ? (
                                    <div className="flex items-center gap-3 justify-between">
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Delete this announcement?</span>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedAnnouncement.id)} disabled={deletingId === selectedAnnouncement.id}>
                                                {deletingId === selectedAnnouncement.id ? "Deleting..." : "Yes, delete"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(selectedAnnouncement.id)}
                                        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5">
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
