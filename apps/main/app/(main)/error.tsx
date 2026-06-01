"use client"

import { useEffect } from "react"

export default function MainError({
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: 24 }}>
            <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--so-ink-4)", marginBottom: 16 }}>
                Error
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 450, letterSpacing: "-0.022em", color: "var(--so-ink)", margin: "0 0 12px" }}>
                Something went wrong.
            </h2>
            <p style={{ fontSize: 14, color: "var(--so-ink-3)", marginBottom: 8 }}>
                An unexpected error occurred on this page.
            </p>
            {error.digest && (
                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--so-ink-5)", marginBottom: 32 }}>
                    ID: {error.digest}
                </p>
            )}
            <button
                onClick={reset}
                style={{ display: "inline-flex", alignItems: "center", height: 40, padding: "0 20px", background: "var(--so-ink)", color: "var(--so-bg)", border: "none", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
                Try again
            </button>
        </div>
    )
}
