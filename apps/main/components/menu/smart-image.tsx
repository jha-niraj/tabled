"use client"

import { useState } from "react"
import { cn } from "@repo/ui/lib/utils"

type Props = {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
    priority?: boolean
}

export function SmartImage({ src, alt, className, style, priority }: Props) {
    const [loaded, setLoaded] = useState(false)
    return (
        <div className={cn("tt-img-wrap", className)} style={style}>
            {/* Plain img on purpose: remote Wikimedia assets, no optimizer round-trip needed for a prototype */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                referrerPolicy="no-referrer"
                data-loaded={loaded}
                onLoad={() => setLoaded(true)}
            />
        </div>
    )
}
