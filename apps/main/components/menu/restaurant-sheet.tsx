"use client"

import { Award, Clock, MapPin, Phone } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@repo/ui/components/ui/sheet"
import type { Restaurant } from "@/lib/menu/types"
import { MediaCarousel } from "./media-carousel"
import { Rating } from "./rating"

type Props = { restaurant: Restaurant; open: boolean; onOpenChange: (o: boolean) => void }

export function RestaurantSheet({ restaurant: r, open, onOpenChange }: Props) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="tt tt-sheet p-0 h-[92dvh] rounded-t-[28px] border-t sm:max-w-xl sm:mx-auto overflow-hidden">
                <div className="overflow-y-auto h-full tt-scrollbar-none">
                    <div className="sticky top-0 z-10 flex justify-center pt-2.5 pb-1 pointer-events-none">
                        <span className="w-10 h-1.5 rounded-full" style={{ background: "rgba(127,110,90,0.45)" }} />
                    </div>
                    <div className="px-4 pt-1">
                        <MediaCarousel images={r.media.hero} video={r.media.video} aspect="16 / 10" />
                    </div>
                    <div className="px-5 pt-5 pb-10 flex flex-col gap-7">
                        <header className="flex flex-col gap-2">
                            <span className="tt-eyebrow">{r.cuisine.join(" · ")}</span>
                            <SheetTitle className="tt-display text-[32px] leading-[1.05] text-[var(--tt-ink)] font-medium">{r.name}</SheetTitle>
                            <SheetDescription className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{r.shortDescription}</SheetDescription>
                        </header>

                        <section className="rounded-[var(--tt-radius)] p-4 flex flex-col gap-4" style={{ background: "var(--tt-paper-2)" }}>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="tt-display text-[44px] leading-none">{r.ratings.overall.toFixed(1)}</div>
                                    <div className="text-xs text-[var(--tt-ink-3)] mt-1">
                                        {r.ratings.totalReviews.toLocaleString("en-IN")} reviews across platforms
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {r.ratings.platforms.map((p) => (
                                        <div key={p.name} className="flex items-center gap-2 text-xs text-[var(--tt-ink-3)]">
                                            <span>{p.name}</span>
                                            <Rating avg={p.rating} count={p.count} compact />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.entries(r.ratings.breakdown).map(([k, v]) => (
                                    <div key={k} className="flex flex-col gap-1.5">
                                        <div className="tt-bar">
                                            <i style={{ width: `${(v / 5) * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] text-[var(--tt-ink-3)] capitalize">
                                            {k} {v.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-2.5">
                            <h3 className="tt-eyebrow">The story</h3>
                            <p className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{r.story}</p>
                        </section>

                        <section className="flex flex-col gap-2.5">
                            <h3 className="tt-eyebrow">How a Thai table eats</h3>
                            <p className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{r.chefNote}</p>
                        </section>

                        <section className="flex flex-col gap-2.5">
                            <h3 className="tt-eyebrow">Recognition</h3>
                            <ul className="flex flex-col gap-2">
                                {r.awards.map((a) => (
                                    <li key={a} className="flex items-start gap-2 text-sm text-[var(--tt-ink-2)]">
                                        <Award size={15} className="mt-0.5 text-[var(--tt-gold)] shrink-0" /> {a}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="flex flex-col gap-2.5">
                            <h3 className="tt-eyebrow">The room</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {r.ambience.map((a) => (
                                    <span key={a} className="tt-badge">
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-3 text-sm text-[var(--tt-ink-2)]">
                            <div className="flex items-start gap-2.5">
                                <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--tt-ink-3)]" /> {r.address}
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Clock size={15} className="mt-0.5 shrink-0 text-[var(--tt-ink-3)]" />
                                <span>
                                    Weekdays {r.hours.weekdays}
                                    <br />
                                    Weekends {r.hours.weekends}
                                </span>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <Phone size={15} className="mt-0.5 shrink-0 text-[var(--tt-ink-3)]" /> {r.phone}
                            </div>
                            <div className="text-xs text-[var(--tt-ink-4)]">{r.priceRange}</div>
                        </section>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
