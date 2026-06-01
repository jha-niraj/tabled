"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { useSearchParams } from "next/navigation"
import { authClient, signIn } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"

const Logomark = ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        <circle cx="28" cy="16" r="2" fill="currentColor" opacity="0.6" />
    </svg>
)

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC04" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38Z" />
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
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--so-ink-3)', display: 'inline-block', marginBottom: 24 }}>Your product category</span>
            <h1 style={{ fontSize: 'clamp(40px,4.4vw,60px)', lineHeight: 1.02, letterSpacing: '-0.03em', fontWeight: 450, color: 'var(--so-ink)', maxWidth: '12ch', margin: 0 }}>
                Your headline goes here.
            </h1>
            <p style={{ marginTop: 24, fontSize: 16, color: 'var(--so-ink-2)', maxWidth: '38ch', lineHeight: 1.55 }}>
                A short description of what your product does and why users love it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 40 }}>
                {['Feature one - brief benefit.', 'Feature two - brief benefit.', 'Feature three - brief benefit.'].map(point => (
                    <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14.5, color: 'var(--so-ink-2)' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--so-accent-soft)', color: 'var(--so-accent)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m20 6-11 11-5-5" /></svg>
                        </span>
                        {point}
                    </div>
                ))}
            </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--so-line)', paddingTop: 24, marginTop: 40 }}>
            <q style={{ fontStyle: 'italic', fontSize: 20, lineHeight: 1.35, color: 'var(--so-ink)', letterSpacing: '-0.012em', display: 'block', marginBottom: 14, quotes: '""" """' }}>
                A real customer testimonial about how your product helped them.
            </q>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--so-ink-3)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--so-accent)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>A</span>
                Name · Role, Company
            </div>
        </div>
    </aside>
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

// ── Main sign-in form ─────────────────────────────────────────────────────────
// SSO tab removed — use Google OAuth or email/password only.
// Phone number sign-in can be added here later.

function SignInContent() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/home'

    useEffect(() => {
        const verified = searchParams.get('verified')
        const emailParam = searchParams.get('email')
        if (verified === 'true') {
            toast.success('Email verified successfully. You can now sign in.')
            if (emailParam) setEmail(decodeURIComponent(emailParam))
        }
        const error = searchParams.get("error")
        if (error === "OAuthAccountNotLinked") toast.error("This email is already linked to another account.")
        else if (error === "EmailNotVerified") toast.error("Please verify your email first.")
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await signIn.email({
                email,
                password,
                fetchOptions: { throw: false },
            })
            if (result?.error) toast.error("Invalid email or password")
            else { toast.success("Signed in successfully"); window.location.href = callbackUrl }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "An unexpected error occurred"
            toast.error("Sign in failed", { description: msg })
        } finally { setIsLoading(false) }
    }

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true)
        try { await authClient.signIn.social({ provider: "google", callbackURL: callbackUrl }) }
        catch { toast.error("Google sign in failed. Please try again."); setIsGoogleLoading(false) }
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

    return (
        <div style={{ minHeight: '100vh', background: 'var(--so-bg)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1280, display: 'grid', gridTemplateColumns: '1.05fr 1fr', minHeight: '100vh' }}>
            <style>{`@media (max-width: 1023px) { .auth-side-panel { display: none !important; } .auth-form-section { grid-column: 1 / -1 !important; } }`}</style>
            <div className="auth-side-panel"><AuthSidePanel /></div>
            <section className="auth-form-section" style={{ padding: 'clamp(48px,5vw,80px) clamp(28px,5vw,80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--so-bg)' }}>
                <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                    <h1 style={{ fontSize: 'clamp(28px,2.8vw,36px)', fontWeight: 500, letterSpacing: '-0.022em', color: 'var(--so-ink)', margin: 0 }}>Welcome back.</h1>
                    <p style={{ color: 'var(--so-ink-3)', marginTop: 10, fontSize: 14.5 }}>Sign in to your account.</p>

                    {/* Google OAuth */}
                    <div style={{ marginTop: 32 }}>
                        <button onClick={handleGoogleSignIn} disabled={isGoogleLoading}
                            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 12, border: '1px solid var(--so-line)', background: 'var(--so-surface)', color: 'var(--so-ink)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit' }}>
                            {isGoogleLoading ? <DotmSquare11 size={16} dotSize={2} speed={1.5} /> : <GoogleIcon />}
                            Continue with Google
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0', color: 'var(--so-ink-4)', fontSize: 11, fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--so-line)' }} />
                        or
                        <div style={{ flex: 1, height: 1, background: 'var(--so-line)' }} />
                    </div>

                    {/* Email + password form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label htmlFor="email" style={labelStyle}>Email address</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} required style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'var(--so-accent)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--so-line)')} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                                <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                                <Link href="/forgotpassword" style={{ fontSize: 12, color: 'var(--so-ink-3)', fontFamily: 'var(--font-geist-mono)', letterSpacing: '0.04em', textDecoration: 'none' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <PasswordInput id="password" value={password} onChange={setPassword} disabled={isLoading} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--so-ink-2)', cursor: 'pointer', userSelect: 'none', lineHeight: 1.5 }}>
                            <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: 'var(--so-accent)' }} />
                            Keep me signed in for 30 days.
                        </label>
                        <button type="submit" disabled={isLoading}
                            style={{ width: '100%', height: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8, transition: 'background 0.2s ease' }}>
                            {isLoading ? <DotmSquare11 size={16} dotSize={2} speed={1.5} /> : <>Sign in <ArrowRight size={14} /></>}
                        </button>
                    </form>

                    <p style={{ marginTop: 24, fontSize: 14, color: 'var(--so-ink-3)', textAlign: 'center' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" style={{ color: 'var(--so-ink)', fontWeight: 500, textDecoration: 'none' }}>Sign up</Link>
                    </p>
                </div>
            </section>
        </div>
        </div>
    )
}

export default function SignInClient() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--so-bg)' }}>
                <InlineLoader size={24} />
            </div>
        }>
            <SignInContent />
        </Suspense>
    )
}
