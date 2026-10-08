import { Flame } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

const LABELS = ["No heat", "Mild", "Medium", "Hot", "Thai hot"]

export function SpiceMeter({ level, adjustable, compact }: { level: number; adjustable?: boolean; compact?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5" title={`${LABELS[level]}${adjustable ? ", adjustable" : ""}`}>
            <span className="inline-flex items-center gap-[3px]">
                {[1, 2, 3, 4].map((i) => (
                    <Flame
                        key={i}
                        size={compact ? 11 : 13}
                        strokeWidth={2.2}
                        className={cn(i <= level ? "text-[var(--tt-chili)]" : "text-[var(--tt-line-2)]")}
                        fill={i <= level ? "currentColor" : "none"}
                    />
                ))}
            </span>
            {!compact && (
                <span className="text-xs text-[var(--tt-ink-3)]">
                    {LABELS[level]}
                    {adjustable ? " · adjustable" : ""}
                </span>
            )}
        </span>
    )
}
