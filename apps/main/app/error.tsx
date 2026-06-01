"use client"

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--so-bg)' }}>
            <div style={{ textAlign: 'center', maxWidth: 480 }}>
                <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--so-ink-4)', marginBottom: 24 }}>
                    500
                </p>
                <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 450, letterSpacing: '-0.03em', color: 'var(--so-ink)', margin: '0 0 16px' }}>
                    Something went wrong.
                </h1>
                <p style={{ fontSize: 16, color: 'var(--so-ink-3)', lineHeight: 1.6, margin: '0 0 12px' }}>
                    An unexpected error occurred. Try refreshing the page.
                </p>
                {error.digest && (
                    <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 11, color: 'var(--so-ink-5)', margin: '0 0 40px' }}>
                        Error ID: {error.digest}
                    </p>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={reset}
                        style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 24px', background: 'var(--so-ink)', color: 'var(--so-bg)', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        Try again
                    </button>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', height: 46, padding: '0 24px', background: 'transparent', color: 'var(--so-ink)', border: '1px solid var(--so-line)', borderRadius: 999, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    )
}
