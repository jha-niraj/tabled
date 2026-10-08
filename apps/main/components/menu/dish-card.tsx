"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"
import type { Dish } from "@/lib/menu/types"
import { SmartImage } from "./smart-image"
import { SpiceMeter } from "./spice-meter"
import { Rating } from "./rating"

const TAG_LABEL: Record<string, string> = {
    "most-loved": "Most loved",
    "chef-pick": "Chef's pick",
    signature: "Signature",
    "first-timer-safe": "Safe first pick",
}

export function dishHeroTag(d: Dish): string | null {
    for (const t of ["most-loved", "signature", "chef-pick", "first-timer-safe"]) {
        if (d.tags.includes(t)) return TAG_LABEL[t] ?? null
    }
    return null
}

type Props = {
    dish: Dish
    onOpen: (dish: Dish) => void
    index?: number
    width?: number | string
}

export function DishCard({ dish, onOpen, index = 0, width = 236 }: Props) {
    const tag = dishHeroTag(dish)
    const cover = dish.media.images[0]
    return (
        <motion.button
            type="button"
            onClick={() => onOpen(dish)}
            className="tt-card text-left shrink-0 snap-start flex flex-col"
            style={{ width }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * index, duration: 0.3, ease: "easeOut" }}
            aria-label={`${dish.name}, open details`}
        >
            <div className="relative">
                {cover && <SmartImage src={cover.src} alt={cover.alt} style={{ aspectRatio: "4 / 3" }} />}
                {tag && (
                    <span
                        className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide text-white"
                        style={{ background: "rgba(20,14,10,0.62)", backdropFilter: "blur(8px)" }}
                    >
                        {tag}
                    </span>
                )}
                {dish.media.video && (
                    <span
                        className="absolute bottom-2.5 right-2.5 inline-flex items-center justify-center rounded-full text-white"
                        style={{ width: 26, height: 26, background: "rgba(20,14,10,0.62)", backdropFilter: "blur(8px)" }}
                        aria-label="Has video"
                    >
                        <Play size={11} fill="currentColor" />
                    </span>
                )}
            </div>
            <div className="p-3.5 flex flex-col gap-1.5">
                <div>
                    <div className="tt-display-sm text-[17px] leading-tight text-[var(--tt-ink)]">{dish.name}</div>
                    <div className="tt-eyebrow mt-1">{dish.thaiName}</div>
                </div>
                <p className="text-[13px] leading-snug text-[var(--tt-ink-2)] line-clamp-2">{dish.tagline}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-[var(--tt-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                        Rs {dish.price}
                    </span>
                    <SpiceMeter level={dish.spice} compact />
                    <Rating avg={dish.rating.avg} compact />
                </div>
            </div>
        </motion.button>
    )
}

export function DishRail({ dishes, onOpen }: { dishes: Dish[]; onOpen: (d: Dish) => void }) {
    if (dishes.length === 0) return null
    return (
        <div className="-mx-4 px-4 tt-fade-x">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 tt-scrollbar-none">
                {dishes.map((d, i) => (
                    <DishCard key={d.id} dish={d} onOpen={onOpen} index={i} />
                ))}
                <div className="shrink-0 w-1" />
            </div>
        </div>
    )
}
