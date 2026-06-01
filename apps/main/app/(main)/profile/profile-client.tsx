"use client"

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, ArrowRight, User, Lock, Monitor, Trash2, ShieldOff } from 'lucide-react'
import Image from 'next/image'
import { DotmSquare11 } from '@repo/ui/components/ui/dotm-square-11'
import { InlineLoader } from '@repo/ui/components/ui/loader'
import { ConfirmDialog } from '@repo/ui/components/ui/confirm-dialog'
import { authClient, signOut } from '@repo/auth/client'
import { toast } from '@repo/ui/components/ui/sonner'
import { updateProfile, updateAvatar, notifyPasswordChanged, deleteAccount } from '@/actions/profile.action'
import { getSignedUploadParams } from '@/actions/cloudinary.action'
import { useMainProfileStore } from '@/stores/main-profile.store'

type Tab = 'profile' | 'security' | 'account'

async function uploadToCloudinary(file: File): Promise<string> {
    const { data, success, error } = await getSignedUploadParams({ folder: 'avatars' })
    if (!success || !data) throw new Error(error ?? 'Failed to get upload params')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', data.apiKey)
    formData.append('timestamp', String(data.timestamp))
    formData.append('signature', data.signature)
    formData.append('folder', data.folder)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`, { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Upload failed')
    const json = await res.json()
    return json.secure_url as string
}

const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 16px',
    background: 'var(--so-bg)', border: '1px solid var(--so-line)',
    borderRadius: 12, fontFamily: 'inherit', fontSize: 14,
    color: 'var(--so-ink)', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
}
const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-geist-mono)', fontSize: 11,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--so-ink-4)', display: 'block', marginBottom: 6,
}

interface SessionItem {
    id: string
    token: string
    userAgent?: string | null
    ipAddress?: string | null
    createdAt: string | Date
}

export default function ProfileClient({
    initialName,
    initialEmail,
    initialImage,
}: {
    initialName: string
    initialEmail: string
    initialImage: string | null
}) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const setStoreAvatar = useMainProfileStore(state => state.setAvatarUrl)

    const [tab, setTab] = useState<Tab>('profile')
    const [name, setName] = useState(initialName)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImage)
    const [savingProfile, setSavingProfile] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd, setNewPwd] = useState('')
    const [confirmPwd, setConfirmPwd] = useState('')
    const [changingPwd, setChangingPwd] = useState(false)

    const [sessions, setSessions] = useState<SessionItem[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [revokingAll, setRevokingAll] = useState(false)

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (tab === 'security') loadSessions()
    }, [tab])

    async function loadSessions() {
        setLoadingSessions(true)
        try {
            const result = await authClient.listSessions()
            if (result?.data) setSessions(result.data as SessionItem[])
        } catch { /* silent */ }
        finally { setLoadingSessions(false) }
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5 MB'); return }
        setUploadingAvatar(true)
        try {
            const url = await uploadToCloudinary(file)
            await updateAvatar(url)
            setAvatarUrl(url)
            setStoreAvatar(url)
            toast.success('Profile picture updated')
            router.refresh()
        } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed') }
        finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        setSavingProfile(true)
        const result = await updateProfile({ name })
        setSavingProfile(false)
        if (result.success) { toast.success('Profile updated'); router.refresh() }
        else toast.error(result.error ?? 'Failed to update profile')
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        if (newPwd.length < 8) { toast.error('New password must be at least 8 characters'); return }
        if (newPwd !== confirmPwd) { toast.error("Passwords don't match"); return }
        setChangingPwd(true)
        try {
            const result = await authClient.changePassword({ currentPassword: currentPwd, newPassword: newPwd, revokeOtherSessions: false })
            if (result.error) toast.error(result.error.message || 'Incorrect current password')
            else {
                toast.success('Password changed successfully')
                setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
                await notifyPasswordChanged()
                await loadSessions()
            }
        } catch { toast.error('Something went wrong.') }
        finally { setChangingPwd(false) }
    }

    async function handleRevokeSession(token: string, id: string) {
        setRevokingId(id)
        try {
            await authClient.revokeSession({ token })
            toast.success('Session revoked')
            await loadSessions()
        } catch { toast.error('Failed to revoke session') }
        finally { setRevokingId(null) }
    }

    async function handleRevokeAllOther() {
        setRevokingAll(true)
        try {
            await authClient.revokeOtherSessions()
            toast.success('All other sessions signed out')
            await loadSessions()
        } catch { toast.error('Failed to revoke sessions') }
        finally { setRevokingAll(false) }
    }

    async function handleDeleteAccount() {
        setDeleting(true)
        try {
            const result = await deleteAccount()
            if (!result.success) { toast.error(result.error ?? 'Failed to delete account'); return }
            await signOut()
            router.push('/')
        } catch { toast.error('Something went wrong') }
        finally { setDeleting(false) }
    }

    const initials = (name || initialEmail || 'U')[0]?.toUpperCase() ?? 'U'

    function parseUserAgent(ua?: string | null): string {
        if (!ua) return 'Unknown device'
        if (ua.includes('Chrome')) return 'Chrome'
        if (ua.includes('Firefox')) return 'Firefox'
        if (ua.includes('Safari')) return 'Safari'
        if (ua.includes('Edge')) return 'Edge'
        return ua.slice(0, 40)
    }

    const TABS: { value: Tab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
        { value: 'profile', label: 'Profile', Icon: User },
        { value: 'security', label: 'Security', Icon: Lock },
        { value: 'account', label: 'Account', Icon: ShieldOff },
    ]

    return (
        <div style={{ maxWidth: 560 }}>
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete your account?"
                description="This will permanently delete your account and all associated data. This action cannot be undone."
                confirmLabel="Yes, delete my account"
                cancelLabel="Cancel"
                variant="destructive"
                loading={deleting}
                onConfirm={handleDeleteAccount}
            />

            <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--so-ink-4)', marginBottom: 16 }}>Account</p>
            <h1 style={{ fontSize: 'clamp(24px,2.8vw,32px)', fontWeight: 450, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: '0 0 32px' }}>Your profile.</h1>

            {/* Avatar */}
            <div style={{ padding: 24, background: 'var(--so-surface)', border: '1px solid var(--so-line)', borderRadius: 16, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                        style={{ position: 'relative', width: 72, height: 72, borderRadius: 999, cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'block' }}>
                        {avatarUrl
                            ? <Image src={avatarUrl} alt={name || 'Avatar'} width={72} height={72} style={{ borderRadius: 999, objectFit: 'cover' }} />
                            : <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--so-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600 }}>{initials}</div>
                        }
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: uploadingAvatar ? 1 : 0, transition: 'opacity 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => { if (!uploadingAvatar) e.currentTarget.style.opacity = '0' }}>
                            {uploadingAvatar ? <InlineLoader size={18} /> : <Camera size={18} color="white" />}
                        </div>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </div>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--so-ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'No name set'}</p>
                    <p style={{ fontSize: 13, color: 'var(--so-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{initialEmail}</p>
                    <p style={{ fontSize: 11, color: 'var(--so-ink-4)', marginTop: 6, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em' }}>Click avatar to change photo</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--so-line)', marginBottom: 28 }}>
                {TABS.map(({ value, label, Icon }) => (
                    <button key={value} onClick={() => setTab(value)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === value ? '2px solid var(--so-ink)' : '2px solid transparent', marginBottom: -1, fontSize: 14, fontWeight: tab === value ? 500 : 400, color: tab === value ? 'var(--so-ink)' : 'var(--so-ink-3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {tab === 'profile' && (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Display name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'var(--so-accent)')} onBlur={e => (e.target.style.borderColor = 'var(--so-line)')} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email address</label>
                        <input value={initialEmail} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', background: 'var(--so-bg-2)' }} />
                        <span style={{ fontSize: 11, color: 'var(--so-ink-4)', marginTop: 4, display: 'block', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em' }}>Email cannot be changed here.</span>
                    </div>
                    <button type="submit" disabled={savingProfile}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}>
                        {savingProfile ? <DotmSquare11 size={15} dotSize={2} speed={1.2} /> : <><Check size={15} /> Save changes</>}
                    </button>
                </form>
            )}

            {/* Security Tab */}
            {tab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                    <div>
                        <p style={{ ...labelStyle, marginBottom: 16 }}>Change password</p>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { id: 'cpwd', label: 'Current password', value: currentPwd, onChange: setCurrentPwd },
                                { id: 'npwd', label: 'New password', value: newPwd, onChange: setNewPwd, placeholder: 'At least 8 characters' },
                                { id: 'cpwd2', label: 'Confirm new password', value: confirmPwd, onChange: setConfirmPwd },
                            ].map(({ id, label, value, onChange, placeholder }) => (
                                <div key={id}>
                                    <label style={labelStyle}>{label}</label>
                                    <input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '••••••••'} required style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'var(--so-accent)')} onBlur={e => (e.target.style.borderColor = 'var(--so-line)')} />
                                </div>
                            ))}
                            <button type="submit" disabled={changingPwd}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: 'fit-content' }}>
                                {changingPwd ? <DotmSquare11 size={15} dotSize={2} speed={1.2} /> : <>Change password <ArrowRight size={14} /></>}
                            </button>
                        </form>
                    </div>

                    {/* Sessions */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <p style={labelStyle}>Active sessions</p>
                            {sessions.length > 1 && (
                                <button onClick={handleRevokeAllOther} disabled={revokingAll}
                                    style={{ fontSize: 12, color: 'var(--so-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>
                                    {revokingAll ? 'Signing out…' : 'Sign out all other sessions'}
                                </button>
                            )}
                        </div>
                        {loadingSessions
                            ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><InlineLoader size={24} /></div>
                            : sessions.length === 0
                                ? <p style={{ fontSize: 13, color: 'var(--so-ink-4)', padding: '16px 0' }}>No sessions found.</p>
                                : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--so-line)', border: '1px solid var(--so-line)', borderRadius: 12, overflow: 'hidden' }}>
                                        {sessions.map((s) => (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--so-bg)', gap: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                    <Monitor size={15} style={{ color: 'var(--so-ink-4)', flexShrink: 0 }} />
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--so-ink)', margin: 0 }}>
                                                            {parseUserAgent(s.userAgent)}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: 'var(--so-ink-4)', margin: '2px 0 0', fontFamily: 'var(--font-geist-mono)' }}>
                                                            {s.ipAddress ?? 'Unknown IP'} · {new Date(s.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeSession(s.token, s.id)} disabled={revokingId === s.id}
                                                    style={{ fontSize: 12, color: 'var(--so-ink-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>
                                                    {revokingId === s.id ? <DotmSquare11 size={12} dotSize={2} speed={1.2} /> : 'Revoke'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                        }
                    </div>
                </div>
            )}

            {/* Account Tab */}
            {tab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ padding: 20, border: '1px solid var(--so-line)', borderRadius: 12, background: 'var(--so-surface)' }}>
                        <p style={{ ...labelStyle, marginBottom: 12 }}>Account details</p>
                        <p style={{ fontSize: 13, color: 'var(--so-ink-2)', margin: 0 }}>
                            <span style={{ color: 'var(--so-ink-4)', fontFamily: 'var(--font-geist-mono)', fontSize: 11, marginRight: 8 }}>Email</span>
                            {initialEmail}
                        </p>
                    </div>
                    <div style={{ padding: 20, border: '1px solid #fca5a5', borderRadius: 12, background: 'rgba(220,38,38,0.04)' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Danger Zone</p>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
                            Permanently delete your account and all associated data. This cannot be undone.
                        </p>
                        <button onClick={() => setDeleteDialogOpen(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Trash2 size={14} />
                            Delete my account
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
