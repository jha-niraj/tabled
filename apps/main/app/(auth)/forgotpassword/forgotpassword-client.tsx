"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Mail } from "lucide-react"
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

const AuthSidePanel = () => (
    <aside style={{ position: 'relative', padding: 'clamp(48px,6vw,96px)', background: 'var(--so-bg-2)', borderRight: '1px solid var(--so-line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', minHeight: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, backgroundImage: 'linear-gradient(var(--so-line-2) 1px, transparent 1px), linear-gradient(90deg, var(--so-line-2) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(circle at 30% 30%, #000, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at 30% 30%, #000, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--so-ink)', textDecoration: 'none' }}>
                <Logomark /><span>YourApp</span>
            </Link>
        </div>
        <div style={{ position: 'relative', zIndex: 1, marginTop: 56 }}>
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--so-ink-3)', display: 'inline-block', marginBottom: 24 }}>Account recovery</span>
            <h1 style={{ fontSize: 'clamp(40px,4.4vw,60px)', lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 450, color: 'var(--so-ink)', maxWidth: '14ch', margin: 0 }}>
                Back in your account in minutes.
            </h1>
            <p style={{ marginTop: 24, fontSize: 16, color: 'var(--so-ink-2)', maxWidth: '38ch', lineHeight: 1.55 }}>
                Enter the email address associated with your account and we&apos;ll send you a reset link.
            </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--so-line)', paddingTop: 24, marginTop: 40 }}>
            <q style={{ fontStyle: 'italic', fontSize: 20, lineHeight: 1.35, color: 'var(--so-ink)', letterSpacing: '-0.012em', display: 'block', marginBottom: 14, quotes: '"“" "”"' }}>
                A real customer testimonial about your product.
            </q>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--so-ink-3)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--so-accent)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>A</span>
                Name · Role, Company
            </div>
        </div>
    </aside>
)

function ForgotPasswordContent() {
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const inputStyle: React.CSSProperties = { width: '100%', height: 48, padding: '0 16px', background: 'var(--so-bg)', border: '1px solid var(--so-line)', borderRadius: 12, fontFamily: 'inherit', fontSize: 14, color: 'var(--so-ink)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s ease' }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await authClient.requestPasswordReset({ email, redirectTo: '/resetpassword' })
            setSent(true)
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--so-bg)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1280, display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh' }}>
            <style>{`@media (max-width: 1023px) { .auth-side-panel { display: none !important; } .auth-form-section { grid-column: 1 / -1 !important; } }`}</style>
            <div className="auth-side-panel"><AuthSidePanel /></div>
            <section className="auth-form-section" style={{ padding: 'clamp(48px,5vw,80px) clamp(28px,5vw,80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--so-bg)' }}>
                <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                    {!sent ? (
                        <>
                            <Link href="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--so-ink-3)', textDecoration: 'none', marginBottom: 24 }}>
                                <ArrowLeft size={13} /> Back to sign in
                            </Link>
                            <h1 style={{ fontSize: 'clamp(28px,2.8vw,36px)', fontWeight: 500, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: 0 }}>Reset your password.</h1>
                            <p style={{ color: 'var(--so-ink-3)', marginTop: 10, fontSize: 14.5 }}>
                                Enter the email you signed up with - we&apos;ll send a reset link. It expires in 30 minutes.
                            </p>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
                                <div>
                                    <label htmlFor="email" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--so-ink-4)', display: 'block', marginBottom: 6 }}>Email address</label>
                                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required disabled={isLoading} style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = 'var(--so-accent)')}
                                        onBlur={e => (e.target.style.borderColor = 'var(--so-line)')} />
                                </div>
                                <button type="submit" disabled={isLoading} style={{ width: '100%', height: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                                    {isLoading ? <DotmSquare11 size={16} dotSize={2} speed={1.5} /> : <>Send reset link <ArrowRight size={14} /></>}
                                </button>
                            </form>
                            <p style={{ marginTop: 24, fontSize: 14, color: 'var(--so-ink-3)', textAlign: 'center' }}>
                                Remember it?{' '}
                                <Link href="/signin" style={{ color: 'var(--so-ink)', fontWeight: 500, textDecoration: 'none' }}>Sign in instead</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--so-accent-soft)', color: 'var(--so-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                <Mail size={20} />
                            </div>
                            <h1 style={{ fontSize: 'clamp(28px,2.8vw,36px)', fontWeight: 500, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: 0 }}>Check your inbox.</h1>
                            <p style={{ color: 'var(--so-ink-3)', marginTop: 10, fontSize: 14.5, lineHeight: 1.6 }}>
                                We sent a reset link to <strong style={{ color: 'var(--so-ink)' }}>{email}</strong>. The link expires in 30 minutes. If it doesn&apos;t arrive, check spam.
                            </p>
                            <div style={{ marginTop: 32, padding: 20, background: 'var(--so-bg-2)', border: '1px solid var(--so-line)', borderRadius: 12, fontSize: 13, color: 'var(--so-ink-2)', lineHeight: 1.6 }}>
                                <strong style={{ display: 'block', color: 'var(--so-ink)', marginBottom: 6 }}>Didn&apos;t get it?</strong>
                                Wait 60 seconds, then{' '}
                                <button onClick={() => setSent(false)} style={{ color: 'var(--so-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}>
                                    send again
                                </button>.
                            </div>
                            <Link href="/signin" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 46, marginTop: 24, borderRadius: 999, border: '1px solid var(--so-line)', background: 'transparent', color: 'var(--so-ink)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                                Back to sign in
                            </Link>
                        </>
                    )}
                </div>
            </section>
        </div>
    </div>
    )
}

export default function ForgotPasswordClient() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--so-bg)' }}>
                <InlineLoader size={24} />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    )
}
