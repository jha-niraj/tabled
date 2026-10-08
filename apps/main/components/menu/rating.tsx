import { Star } from "lucide-react"

export function Rating({ avg, count, compact }: { avg: number; count?: number; compact?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1 text-[var(--tt-ink-2)]">
            <Star size={compact ? 11 : 13} className="text-[var(--tt-gold)]" fill="currentColor" strokeWidth={0} />
            <span className={compact ? "text-xs" : "text-sm"} style={{ fontVariantNumeric: "tabular-nums" }}>
                {avg.toFixed(1)}
                {count !== undefined && <span className="text-[var(--tt-ink-3)]"> ({count.toLocaleString("en-IN")})</span>}
            </span>
        </span>
    )
}
