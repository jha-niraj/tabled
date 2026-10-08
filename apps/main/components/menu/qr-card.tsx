"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function QrCard({ name, tagline, slug }: { name: string; tagline: string; slug: string }) {
    const [url, setUrl] = useState("")
    useEffect(() => {
        setUrl(`${window.location.origin}/m/${slug}`)
    }, [slug])

    const qr = url ? `https://api.qrserver.com/v1/create-qr-code/?size=520x520&margin=0&color=221a14&bgcolor=fffdf8&data=${encodeURIComponent(url)}` : ""

    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <div className="tt-card w-full max-w-sm p-8 flex flex-col items-center text-center gap-5">
                <div>
                    <div className="tt-eyebrow">Scan to meet your table host</div>
                    <h1 className="tt-display text-[34px] leading-tight mt-2">{name}</h1>
                    <p className="text-sm text-[var(--tt-ink-3)] mt-1">{tagline}</p>
                </div>
                <div className="tt-rule w-full" />
                <div className="rounded-[var(--tt-radius)] p-4" style={{ background: "var(--tt-surface)", border: "1px solid var(--tt-line)" }}>
                    {qr ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt={`QR code for ${url}`} width={240} height={240} style={{ display: "block" }} />
                    ) : (
                        <div style={{ width: 240, height: 240 }} />
                    )}
                </div>
                <p className="text-xs text-[var(--tt-ink-3)] break-all">{url}</p>
                <p className="text-xs text-[var(--tt-ink-4)] leading-relaxed">
                    Phone on the same wifi? Start the dev server with <code>-H 0.0.0.0</code> and open this page using your laptop IP so the QR points there.
                </p>
                <Link href={`/m/${slug}`} className="tt-chip">
                    Open without scanning
                </Link>
            </div>
        </main>
    )
}
