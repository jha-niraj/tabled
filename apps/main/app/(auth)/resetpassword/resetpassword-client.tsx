"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { authClient } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"

const Logomark = ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        <circle cx="28" cy="16" r="2.3" fill="var(--so-accent)" />
    </svg>
)

function PasswordInput({ id, value, onChange, placeholder = '••••••••', disabled }: {
    id: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
    const [show, setShow] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
                style={{ width: '100%', height: 48, padding: '0 44px 0 16px', background: 'var(--so-bg)', border: '1px solid var(--so-line)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, color: 'var(--so-ink)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s ease' }}
                onFocus={e => (e.target.style.borderColor = 'var(--so-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--so-line)')} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--so-ink-3)', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    )
}

function ResetPasswordContent() {
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [done, setDone] = useState(false)
    const searchParams = useSearchParams()
    const token = searchParams.get('token') || ''

    const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--so-ink-4)', display: 'block', marginBottom: 6 }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) { toast.error("Passwords don't match"); return }
        if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }
        setIsLoading(true)
        try {
            await authClient.resetPassword({ newPassword: password, token })
            setDone(true)
        } catch {
            toast.error("Reset link may have expired. Please request a new one.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--so-bg)' }}>
            <div style={{ width: '100%', maxWidth: 440 }}>
                <div style={{ marginBottom: 40 }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--so-ink)', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}>
                        <Logomark size={24} /><span>YourApp</span>
                    </Link>
                </div>
                {!done ? (
                    <>
                        <h1 style={{ fontSize: 'clamp(28px,2.8vw,36px)', fontWeight: 500, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: 0 }}>Set a new password.</h1>
                        <p style={{ color: 'var(--so-ink-3)', marginTop: 10, fontSize: 14.5 }}>Choose something strong. You won&apos;t be asked for the old one.</p>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
                            <div>
                                <label htmlFor="password" style={labelStyle}>New password</label>
                                <PasswordInput id="password" value={password} onChange={setPassword} disabled={isLoading} />
                            </div>
                            <div>
                                <label htmlFor="confirm" style={labelStyle}>Confirm password</label>
                                <PasswordInput id="confirm" value={confirm} onChange={setConfirm} disabled={isLoading} />
                            </div>
                            <button type="submit" disabled={isLoading}
                                style={{ width: '100%', height: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
                                {isLoading ? <DotmSquare11 size={16} dotSize={2} speed={1.5} /> : <>Set new password <ArrowRight size={14} /></>}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--so-accent-soft)', color: 'var(--so-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <CheckCircle size={24} />
                        </div>
                        <h1 style={{ fontSize: 'clamp(28px,2.8vw,36px)', fontWeight: 500, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: 0 }}>Password updated.</h1>
                        <p style={{ color: 'var(--so-ink-3)', marginTop: 10, fontSize: 14.5 }}>Your password has been changed. You can now sign in with your new credentials.</p>
                        <Link href="/signin" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, padding: '0 32px', marginTop: 32, background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                            Sign in <ArrowRight size={14} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ResetPasswordClient() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--so-bg)' }}>
                <InlineLoader size={24} />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
