"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Megaphone, Plus, Trash2, ExternalLink, AlertCircle, Mail, Send, X, Eye, Info, Pencil, ChevronRight,
} from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/components/ui/select"
import { Label } from "@repo/ui/components/ui/label"
import { toast } from "@repo/ui/components/ui/sonner"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import {
    createBroadcast, updateBroadcast, deleteBroadcast, sendTestBroadcastEmail,
    type PlatformBroadcast, type BroadcastType,
} from "@/actions/broadcasts.action"
import { cn } from "@repo/ui/lib/utils"
import { RichTextEditor } from "@/components/rich-text-editor"

const TYPE_CONFIG: Record<BroadcastType, { label: string; badgeClass: string; dot: string }> = {
    info:    { label: "Info",    badgeClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",     dot: "bg-blue-500" },
    warning: { label: "Warning", badgeClass: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    error:   { label: "Error",   badgeClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",         dot: "bg-red-500" },
    success: { label: "Success", badgeClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", dot: "bg-green-500" },
}

function fmtDate(d: Date | string) {
    return new Date(d).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
}

export function BroadcastsClient({ broadcasts, total }: { broadcasts: PlatformBroadcast[]; total: number }) {
    const router = useRouter()
    const [panelMode, setPanelMode] = useState<"compose" | string | null>(null)
    const panelOpen = panelMode !== null
    const selectedBroadcast = panelMode && panelMode !== "compose"
        ? broadcasts.find(b => b.id === panelMode) ?? null : null

    const [submitting, setSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null)
    const [sendingTestEmail, setSendingTestEmail] = useState(false)
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [type, setType] = useState<BroadcastType>("info")
    const [actionUrl, setActionUrl] = useState("")
    const [actionLabel, setActionLabel] = useState("")

    const resetForm = () => { setTitle(""); setMessage(""); setType("info"); setActionUrl(""); setActionLabel(""); setFormError(null) }
    const openCompose = () => { resetForm(); setPanelMode("compose") }
    const closePanel = () => { setPanelMode(null); resetForm(); setConfirmDeleteId(null) }

    const handleSendTestEmail = async () => {
        if (!title.trim() || !message.trim()) { setFormError("Title and message are required."); return }
        setSendingTestEmail(true)
        try {
            const r = await sendTestBroadcastEmail({ subject: title.trim(), content: message, type, actionUrl: actionUrl.trim() || undefined, actionLabel: actionLabel.trim() || undefined })
            if (r.success) toast.success(`Test email sent to ${r.sentTo}`)
            else toast.error(r.error ?? "Failed to send test email")
        } finally { setSendingTestEmail(false) }
    }

    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) { setFormError("Title and message body are required."); return }
        setSubmitting(true); setFormError(null)
        try {
            await createBroadcast({ subject: title.trim(), content: message, type, actionUrl: actionUrl.trim() || undefined, actionLabel: actionLabel.trim() || undefined })
            toast.success("Broadcast created"); closePanel(); router.refresh()
        } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to create broadcast.") }
        finally { setSubmitting(false) }
    }

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try { await deleteBroadcast(id); setConfirmDeleteId(null); if (panelMode === id) closePanel(); router.refresh() }
        finally { setDeletingId(null) }
    }

    const totalSent = broadcasts.filter(b => b.sentCount > 0).length
    const typeConfig = (t: string) => TYPE_CONFIG[t as BroadcastType] ?? TYPE_CONFIG.info

    return (
        <div className="flex items-start overflow-hidden">
            {/* LEFT — list */}
            <div className={cn("shrink-0 sticky top-0 self-start px-4 sm:px-6 lg:px-8 py-6 space-y-5 transition-all duration-300 ease-in-out", panelOpen ? "w-1/2" : "w-full")}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                            <Megaphone className="w-7 h-7 text-blue-500" /> Platform Broadcasts
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Short notices - preview via test email, then wire up bulk delivery per product</p>
                    </div>
                    {!panelOpen && <Button onClick={openCompose} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> New Broadcast</Button>}
                </div>

                {/* Stats */}
                <div className={cn("grid gap-4 transition-all duration-300", panelOpen ? "grid-cols-2" : "grid-cols-3")}>
                    {[
                        { icon: Megaphone, label: "Total Broadcasts", value: total, bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-400" },
                        { icon: Send, label: "Emailed Out", value: totalSent, bg: "bg-green-100 dark:bg-green-900/30", color: "text-green-600 dark:text-green-400" },
                        ...(!panelOpen ? [{ icon: Eye, label: "Sent Status", value: broadcasts.filter(b => b.status === "SENT").length, bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-400" }] : []),
                    ].map(({ icon: Icon, label, value, bg, color }) => (
                        <div key={label} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                            <div><p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">{value}</p><p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p></div>
                        </div>
                    ))}
                </div>

                {/* List */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{total} broadcast{total !== 1 ? "s" : ""}</h2>
                    </div>
                    {broadcasts.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                            <Megaphone className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No broadcasts yet</p>
                            <p className="text-sm text-neutral-400 dark:text-neutral-500">Create your first broadcast to notify your users.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {broadcasts.map((b) => {
                                const cfg = typeConfig(b.type)
                                const isSel = panelMode === b.id
                                return (
                                    <div key={b.id} onClick={() => setPanelMode(isSel ? null : b.id)}
                                        className={cn("px-5 py-4 cursor-pointer transition-colors flex items-center gap-4",
                                            isSel ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badgeClass}`}>
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />{cfg.label}
                                                </span>
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500">{fmtDate(b.createdAt)}</span>
                                                {b.sentCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                        <Send className="w-3 h-3" /> {b.sentCount} emailed
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{b.subject}</h3>
                                            {!panelOpen && (
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1"
                                                    dangerouslySetInnerHTML={{ __html: b.content }} />
                                            )}
                                        </div>
                                        <ChevronRight className={cn("w-4 h-4 flex-shrink-0 transition-all text-neutral-400", isSel && "rotate-90 text-neutral-700 dark:text-neutral-300")} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT — compose or detail */}
            <div className={cn("transition-all duration-300 ease-in-out overflow-hidden border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950",
                panelOpen ? "w-1/2 opacity-100" : "w-0 opacity-0 pointer-events-none")}
                style={{ height: panelOpen ? "calc(100vh - 1.5rem)" : 0 }}>
                <div className="flex flex-col h-full">
                    {panelMode === "compose" ? (
                        <ComposePanel
                            title={title} setTitle={setTitle} message={message} setMessage={setMessage}
                            type={type} setType={setType} actionUrl={actionUrl} setActionUrl={setActionUrl}
                            actionLabel={actionLabel} setActionLabel={setActionLabel}
                            formError={formError} submitting={submitting} sendingTestEmail={sendingTestEmail}
                            onClose={closePanel} onCreate={handleCreate} onTestEmail={handleSendTestEmail}
                        />
                    ) : selectedBroadcast ? (
                        <DetailPanel
                            broadcast={selectedBroadcast}
                            confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
                            deletingId={deletingId} onDelete={handleDelete} onClose={closePanel} onRefresh={router.refresh}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function ComposePanel({ title, setTitle, message, setMessage, type, setType, actionUrl, setActionUrl, actionLabel, setActionLabel, formError, submitting, sendingTestEmail, onClose, onCreate, onTestEmail }: {
    title: string; setTitle: (v: string) => void; message: string; setMessage: (v: string) => void
    type: BroadcastType; setType: (v: BroadcastType) => void; actionUrl: string; setActionUrl: (v: string) => void
    actionLabel: string; setActionLabel: (v: string) => void; formError: string | null
    submitting: boolean; sendingTestEmail: boolean; onClose: () => void; onCreate: () => void; onTestEmail: () => void
}) {
    return (
        <>
            <div className="flex-none bg-white dark:bg-neutral-950 flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div><h2 className="text-base font-semibold text-neutral-900 dark:text-white">New Broadcast</h2><p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Visible to all users in the platform</p></div>
                <button type="button" onClick={onClose} className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 space-y-4">
                {formError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{formError}
                    </div>
                )}
                <div className="space-y-1.5"><Label htmlFor="bc-title">Title <span className="text-red-500">*</span></Label><Input id="bc-title" placeholder="e.g. New feature available" value={title} onChange={e => setTitle(e.target.value)} /></div>
                <div className="space-y-1.5">
                    <Label>Message Body <span className="text-red-500">*</span></Label>
                    <RichTextEditor value={message} onChange={setMessage} placeholder="Describe the update or notice..." minHeight="360px" maxHeight="360px" />
                </div>
                <div className="space-y-1.5">
                    <Label>Type <span className="text-red-500">*</span></Label>
                    <Select value={type} onValueChange={v => setType(v as BroadcastType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(Object.entries(TYPE_CONFIG) as [BroadcastType, typeof TYPE_CONFIG[BroadcastType]][]).map(([val, cfg]) => (
                                <SelectItem key={val} value={val}><span className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}</span></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5"><Label>Action URL (optional)</Label><Input placeholder="https://..." value={actionUrl} onChange={e => setActionUrl(e.target.value)} /></div>
                {actionUrl.trim() && <div className="space-y-1.5"><Label>Action Label</Label><Input placeholder="e.g. Learn more" value={actionLabel} onChange={e => setActionLabel(e.target.value)} /></div>}
            </div>
            <div className="flex-none bg-white dark:bg-neutral-950 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 flex-wrap">
                <Button variant="outline" onClick={onClose} disabled={submitting || sendingTestEmail}>Cancel</Button>
                <Button variant="outline" onClick={onTestEmail} disabled={submitting || sendingTestEmail} className="gap-2">
                    <Mail className="w-4 h-4" />{sendingTestEmail ? "Sending..." : "Test email"}
                </Button>
                <Button onClick={onCreate} disabled={submitting || sendingTestEmail}>{submitting ? "Creating..." : "Create Broadcast"}</Button>
            </div>
        </>
    )
}

function DetailPanel({ broadcast, confirmDeleteId, setConfirmDeleteId, deletingId, onDelete, onClose, onRefresh }: {
    broadcast: PlatformBroadcast
    confirmDeleteId: string | null; setConfirmDeleteId: (v: string | null) => void
    deletingId: string | null; onDelete: (id: string) => void; onClose: () => void; onRefresh: () => void
}) {
    const cfg = TYPE_CONFIG[broadcast.type as BroadcastType] ?? TYPE_CONFIG.info
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(broadcast.subject)
    const [editMessage, setEditMessage] = useState(broadcast.content)
    const [editType, setEditType] = useState<BroadcastType>((broadcast.type as BroadcastType) ?? "info")
    const [editActionUrl, setEditActionUrl] = useState(broadcast.actionUrl ?? "")
    const [editActionLabel, setEditActionLabel] = useState(broadcast.actionLabel ?? "")
    const [editError, setEditError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const startEdit = () => {
        setEditTitle(broadcast.subject); setEditMessage(broadcast.content)
        setEditType((broadcast.type as BroadcastType) ?? "info")
        setEditActionUrl(broadcast.actionUrl ?? ""); setEditActionLabel(broadcast.actionLabel ?? "")
        setEditError(null); setIsEditing(true)
    }

    const handleSaveEdit = async () => {
        if (!editTitle.trim() || !editMessage.trim()) { setEditError("Title and message are required."); return }
        setSaving(true); setEditError(null)
        try {
            await updateBroadcast(broadcast.id, { subject: editTitle.trim(), content: editMessage, type: editType, actionUrl: editActionUrl.trim() || undefined, actionLabel: editActionLabel.trim() || undefined })
            setIsEditing(false); onRefresh()
        } catch (err) { setEditError(err instanceof Error ? err.message : "Failed to save.") }
        finally { setSaving(false) }
    }

    if (isEditing) return (
        <>
            <div className="flex-none bg-white dark:bg-neutral-950 flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div><h2 className="text-base font-semibold text-neutral-900 dark:text-white">Edit Broadcast</h2><p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Changes will update the broadcast for future sends</p></div>
                <button type="button" onClick={() => setIsEditing(false)} className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6 space-y-4">
                {editError && <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{editError}</div>}
                <div className="space-y-1.5"><Label>Title <span className="text-red-500">*</span></Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Message Body <span className="text-red-500">*</span></Label><RichTextEditor value={editMessage} onChange={setEditMessage} placeholder="Describe the update..." minHeight="360px" maxHeight="360px" /></div>
                <div className="space-y-1.5">
                    <Label>Type <span className="text-red-500">*</span></Label>
                    <Select value={editType} onValueChange={v => setEditType(v as BroadcastType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(Object.entries(TYPE_CONFIG) as [BroadcastType, typeof TYPE_CONFIG[BroadcastType]][]).map(([val, c]) => (
                                <SelectItem key={val} value={val}><span className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />{c.label}</span></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5"><Label>Action URL (optional)</Label><Input placeholder="https://..." value={editActionUrl} onChange={e => setEditActionUrl(e.target.value)} /></div>
                {editActionUrl.trim() && <div className="space-y-1.5"><Label>Action Label</Label><Input placeholder="e.g. Learn more" value={editActionLabel} onChange={e => setEditActionLabel(e.target.value)} /></div>}
            </div>
            <div className="flex-none bg-white dark:bg-neutral-950 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
        </>
    )

    return (
        <>
            <div className="flex-none bg-white dark:bg-neutral-950 flex items-start justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cfg.badgeClass)}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1.5`} />{cfg.label}
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">{fmtDate(broadcast.createdAt)}</span>
                        {broadcast.sentCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                <Send className="w-3 h-3" />{broadcast.sentCount} emailed
                            </span>
                        )}
                    </div>
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white leading-tight truncate">{broadcast.subject}</h2>
                </div>
                <button type="button" onClick={onClose} className="cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ml-3 flex-shrink-0"><X className="w-4 h-4 text-neutral-500" /></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col px-6 pt-3 gap-4">
                <div className="flex-1 min-h-0 flex flex-col">
                    <p className="flex-none text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2">Message</p>
                    <ScrollArea className="flex-1 min-h-0 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                        <div className="rich-editor-content p-4 text-sm text-neutral-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: broadcast.content }} />
                    </ScrollArea>
                </div>
                {broadcast.actionUrl && (
                    <div className="flex-none">
                        <a href={broadcast.actionUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-blue-600 dark:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />{broadcast.actionLabel ?? broadcast.actionUrl}
                        </a>
                    </div>
                )}
                <div className="flex-none bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{broadcast.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500 dark:text-neutral-400">Emailed</span>
                        <span className={cn("font-medium", broadcast.sentCount > 0 ? "text-green-600 dark:text-green-400" : "text-neutral-400")}>
                            {broadcast.sentCount > 0 ? `${broadcast.sentCount} sent` : "Not sent yet"}
                        </span>
                    </div>
                </div>
                <div className="flex-none pb-4">
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5 text-xs text-blue-700 dark:text-blue-400">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        To send to all users, implement <code className="font-mono">sendBroadcastToAllUsers()</code> in <code className="font-mono">broadcasts.action.ts</code> per product.
                    </div>
                </div>
            </div>
            <div className="flex-none bg-white dark:bg-neutral-950 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                {confirmDeleteId === broadcast.id ? (
                    <div className="flex items-center gap-3 justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">Delete this broadcast?</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                            <Button variant="destructive" size="sm" onClick={() => onDelete(broadcast.id)} disabled={deletingId === broadcast.id}>
                                {deletingId === broadcast.id ? "Deleting..." : "Yes, delete"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-3">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(broadcast.id)}
                            className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5">
                            <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                        <Button variant="outline" onClick={startEdit} className="gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}
