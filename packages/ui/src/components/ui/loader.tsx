"use client"

import { DotmSquare11 } from "./dotm-square-11"

export function PageLoader({ label }: { label?: string }) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
            }}
        >
            <DotmSquare11 size={36} dotSize={5} speed={1.2} />
            {label && (
                <p
                    style={{
                        fontSize: 13,
                        fontFamily: "var(--font-geist-mono, monospace)",
                        letterSpacing: "0.08em",
                        opacity: 0.4,
                    }}
                >
                    {label}
                </p>
            )}
        </div>
    )
}

export function InlineLoader({ size = 16 }: { size?: number }) {
    return <DotmSquare11 size={size} dotSize={Math.max(2, Math.round(size / 6))} speed={1.2} />
}
