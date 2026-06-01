import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--so-ink-4)', marginBottom: 16 }}>
                    404
                </p>
                <h2 style={{ fontSize: 28, fontWeight: 450, letterSpacing: '-0.02em', color: 'var(--so-ink)', margin: '0 0 12px' }}>
                    Page not found.
                </h2>
                <p style={{ fontSize: 14, color: 'var(--so-ink-3)', marginBottom: 32 }}>
                    This page doesn&apos;t exist.
                </p>
                <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 20px', background: 'var(--so-ink)', color: 'var(--so-bg)', borderRadius: 999, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                    Back to home
                </Link>
            </div>
        </div>
    )
}
