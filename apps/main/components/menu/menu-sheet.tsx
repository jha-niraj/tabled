"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@repo/ui/components/ui/sheet"
import type { Dish, Restaurant } from "@/lib/menu/types"
import { SmartImage } from "./smart-image"
import { SpiceMeter } from "./spice-meter"
import { Rating } from "./rating"

type Props = {
    restaurant: Restaurant
    open: boolean
    onOpenChange: (o: boolean) => void
    onOpenDish: (dish: Dish) => void
}

export function MenuSheet({ restaurant: r, open, onOpenChange, onOpenDish }: Props) {
    const sections = r.sections.slice().sort((a, b) => a.order - b.order)
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="tt tt-sheet p-0 h-[92dvh] rounded-t-[28px] border-t sm:max-w-xl sm:mx-auto overflow-hidden">
                <div className="overflow-y-auto h-full tt-scrollbar-none">
                    <div className="sticky top-0 z-10 flex justify-center pt-2.5 pb-1 pointer-events-none">
                        <span className="w-10 h-1.5 rounded-full" style={{ background: "rgba(127,110,90,0.45)" }} />
                    </div>
                    <div className="px-5 pt-3 pb-12 flex flex-col gap-8">
                        <header className="flex flex-col gap-1">
                            <span className="tt-eyebrow">The whole book</span>
                            <SheetTitle className="tt-display text-[30px] leading-tight text-[var(--tt-ink)] font-medium">Full menu</SheetTitle>
                            <SheetDescription className="text-sm text-[var(--tt-ink-3)]">
                                {r.dishes.length} dishes in {sections.length} sections. Tap any dish to see it properly.
                            </SheetDescription>
                        </header>
                        {sections.map((s) => {
                            const dishes = r.dishes.filter((d) => d.sectionId === s.id)
                            return (
                                <section key={s.id} className="flex flex-col gap-3">
                                    <div>
                                        <h3 className="tt-display-sm text-[20px] leading-tight">
                                            {s.name} <span className="text-[var(--tt-ink-3)] text-[15px] italic">{s.thai}</span>
                                        </h3>
                                        <p className="text-sm text-[var(--tt-ink-3)] mt-0.5">{s.blurb}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {dishes.map((d) => {
                                            const cover = d.media.images[0]
                                            return (
                                                <button
                                                    key={d.id}
                                                    type="button"
                                                    onClick={() => onOpenDish(d)}
                                                    className="tt-card flex items-center gap-3 p-2 pr-4 text-left"
                                                >
                                                    {cover && <SmartImage src={cover.src} alt={cover.alt} className="w-[72px] h-[72px] rounded-[12px] shrink-0" />}
                                                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                        <div className="tt-display-sm text-[16px] leading-tight truncate">{d.name}</div>
                                                        <div className="text-xs text-[var(--tt-ink-3)] line-clamp-1">{d.tagline}</div>
                                                        <div className="flex items-center gap-3 text-xs mt-0.5">
                                                            <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs {d.price}</span>
                                                            <SpiceMeter level={d.spice} compact />
                                                            <Rating avg={d.rating.avg} compact />
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
