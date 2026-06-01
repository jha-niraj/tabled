import Link from 'next/link'

const Logomark = ({ size = 28 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        <circle cx="28" cy="16" r="2" fill="currentColor" opacity="0.6" />
    </svg>
)

const MAX_W = 1280

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--so-bg)', color: 'var(--so-ink)', fontFamily: 'inherit' }}>

            {/* Nav */}
            <nav style={{ borderBottom: '1px solid var(--so-line)', padding: '0 clamp(24px,5vw,80px)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--so-bg)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)' }}>
                <div style={{ maxWidth: MAX_W, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--so-ink)', textDecoration: 'none' }}>
                        <Logomark size={24} />
                        <span>YourApp</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/signin" style={{ fontSize: 14, color: 'var(--so-ink-2)', textDecoration: 'none', padding: '0 12px', height: 36, display: 'inline-flex', alignItems: 'center', borderRadius: 8 }}>
                            Sign in
                        </Link>
                        <Link href="/signup" style={{ fontSize: 14, fontWeight: 500, color: 'var(--so-bg)', background: 'var(--so-ink)', textDecoration: 'none', padding: '0 16px', height: 36, display: 'inline-flex', alignItems: 'center', borderRadius: 999 }}>
                            Get started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ padding: 'clamp(80px,10vw,140px) clamp(24px,5vw,80px)' }}>
                <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
                    {/* Badge - neutral, no green */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'var(--so-bg-2)', border: '1px solid var(--so-line)', borderRadius: 999, fontSize: 12, fontWeight: 500, color: 'var(--so-ink-3)', letterSpacing: '0.04em', marginBottom: 32 }}>
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--so-ink-3)', display: 'inline-block' }} />
                        Now in beta
                    </div>
                    <h1 style={{ fontSize: 'clamp(44px,6vw,80px)', fontWeight: 450, lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--so-ink)', margin: '0 0 24px', maxWidth: '14ch', marginLeft: 'auto', marginRight: 'auto' }}>
                        Build your product,{' '}
                        <span style={{ color: 'var(--so-ink-2)' }}>not your auth.</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(16px,1.8vw,20px)', color: 'var(--so-ink-3)', maxWidth: '52ch', margin: '0 auto 48px', lineHeight: 1.6 }}>
                        A production-ready starter with authentication, database, and admin panel - so you can focus on what makes your product unique.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                        <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 28px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, fontSize: 15, fontWeight: 500, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                            Start for free
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                        </Link>
                        <Link href="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 28px', background: 'transparent', color: 'var(--so-ink)', border: '1px solid var(--so-line)', borderRadius: 999, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Feature grid */}
            <section style={{ padding: 'clamp(48px,6vw,96px) clamp(24px,5vw,80px)' }}>
                <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, background: 'var(--so-line)', border: '1px solid var(--so-line)', borderRadius: 16, overflow: 'hidden' }}>
                        {[
                            { icon: '🔐', title: 'Auth out of the box', desc: 'Email + password, Google OAuth, password reset, email verification - all wired up.' },
                            { icon: '🗄️', title: 'Typed database layer', desc: 'Drizzle ORM with PostgreSQL. Schema, client, and migrations ready to go.' },
                            { icon: '🛡️', title: 'Route protection', desc: 'Middleware guards protected routes. Redirect to sign-in, redirect back after.' },
                            { icon: '✉️', title: 'Transactional email', desc: 'Resend integration for reset password and verification emails.' },
                            { icon: '⚡', title: 'Next.js 15 + Turborepo', desc: 'App Router, server components, monorepo structure - all set up correctly.' },
                            { icon: '🎨', title: 'Design system included', desc: 'Shadcn/ui components, Tailwind v4, and a clean auth design system ready to customize.' },
                        ].map(f => (
                            <div key={f.title} style={{ padding: '32px 28px', background: 'var(--so-bg)' }}>
                                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--so-ink)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: 'var(--so-ink-3)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: 'clamp(48px,6vw,96px) clamp(24px,5vw,80px)' }}>
                <div style={{ maxWidth: MAX_W, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ padding: 'clamp(48px,5vw,80px)', background: 'var(--so-bg-2)', border: '1px solid var(--so-line)', borderRadius: 20 }}>
                        <h2 style={{ fontSize: 'clamp(32px,3.6vw,48px)', fontWeight: 450, letterSpacing: '-0.028em', color: 'var(--so-ink)', margin: '0 0 16px' }}>Ready to ship?</h2>
                        <p style={{ fontSize: 16, color: 'var(--so-ink-3)', margin: '0 0 36px' }}>Create an account and be up and running in minutes.</p>
                        <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 50, padding: '0 28px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
                            Get started for free
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--so-line)', padding: 'clamp(24px,3vw,40px) clamp(24px,5vw,80px)' }}>
                <div style={{ maxWidth: MAX_W, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--so-ink-4)', fontSize: 13 }}>
                        <Logomark size={18} />
                        <span>YourApp</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--so-ink-4)', margin: 0 }}>
                        Built with the base code starter.
                    </p>
                </div>
            </footer>
        </div>
    )
}
