"use client"

import type React from "react"

const GRID = 3
const DELAYS = [0, 0.12, 0.24, 0.12, 0.24, 0.36, 0.24, 0.36, 0.48]

export function DotmSquare11({
    size = 20,
    dotSize = 3,
    speed = 1.5,
    color = "currentColor",
}: {
    size?: number
    dotSize?: number
    speed?: number
    color?: string
}) {
    const gap = Math.max(1, dotSize * 0.5)
    const totalSize = dotSize * GRID + gap * (GRID - 1)
    const scale = size / totalSize

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
                flexShrink: 0,
            }}
            aria-hidden="true"
        >
            <style>{`
                @keyframes _dotm_pulse {
                    0%, 100% { opacity: 0.2; transform: scale(0.75); }
                    50% { opacity: 1; transform: scale(1); }
                }
            `}</style>
            <span
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${GRID}, ${dotSize}px)`,
                    gap: gap,
                    transform: `scale(${scale})`,
                    transformOrigin: "center",
                }}
            >
                {DELAYS.map((delay, i) => (
                    <span
                        key={i}
                        style={{
                            width: dotSize,
                            height: dotSize,
                            borderRadius: Math.max(1, dotSize * 0.25),
                            background: color,
                            animation: `_dotm_pulse ${speed}s ease-in-out ${delay}s infinite`,
                        }}
                    />
                ))}
            </span>
        </span>
    )
}
