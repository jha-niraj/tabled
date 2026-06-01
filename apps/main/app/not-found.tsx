import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--so-bg)' }}>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--so-ink-4)', marginBottom: 24 }}>
                    404
                </p>
                <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 450, letterSpacing: '-0.03em', color: 'var(--so-ink)', margin: '0 0 16px' }}>
                    Page not found.
                </h1>
                <p style={{ fontSize: 16, color: 'var(--so-ink-3)', lineHeight: 1.6, margin: '0 0 40px' }}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                        Go home
                    </Link>
                    <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'transparent', color: 'var(--so-ink)', border: '1px solid var(--so-line)', borderRadius: 999, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
