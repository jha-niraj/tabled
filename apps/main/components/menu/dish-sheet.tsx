"use client"

import { Clock, Users, UtensilsCrossed, MessageCircleQuestion } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@repo/ui/components/ui/sheet"
import type { Dish, Restaurant } from "@/lib/menu/types"
import { MediaCarousel } from "./media-carousel"
import { SpiceMeter } from "./spice-meter"
import { Rating } from "./rating"
import { SmartImage } from "./smart-image"
import { dishHeroTag } from "./dish-card"

type Props = {
    dish: Dish | null
    restaurant: Restaurant
    open: boolean
    onOpenChange: (open: boolean) => void
    onOpenDish: (dish: Dish) => void
    onAsk: (question: string) => void
}

const DIETARY_TONE: Record<string, "leaf" | "chili" | "saffron" | undefined> = {
    vegan: "leaf",
    vegetarian: "leaf",
    "jain-possible": "leaf",
    "gluten-free": "leaf",
    "contains-nuts": "chili",
    "contains-dairy": "saffron",
    "contains-soy": "saffron",
    "contains-gluten": "saffron",
}

function prettyTag(t: string) {
    return t.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

export function DishSheet({ dish, restaurant, open, onOpenChange, onOpenDish, onAsk }: Props) {
    const pairs = dish ? restaurant.dishes.filter((d) => dish.pairsWith.includes(d.id)) : []
    const section = dish ? restaurant.sections.find((s) => s.id === dish.sectionId) : null
    const tag = dish ? dishHeroTag(dish) : null

    const quick = dish
        ? [
              { label: "How do I eat this?", q: `How do I eat the ${dish.name} properly?` },
              { label: "What does it taste like?", q: `What does the ${dish.name} taste like, compared to something I might know?` },
              { label: "Is it spicy?", q: `How spicy is the ${dish.name}, and can I get it milder?` },
              { label: "What goes with it?", q: `What should I order alongside the ${dish.name}?` },
          ]
        : []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="tt tt-sheet p-0 h-[92dvh] rounded-t-[28px] border-t sm:max-w-xl sm:mx-auto overflow-hidden flex flex-col gap-0">
                {dish && (
                    <div className="overflow-y-auto overscroll-contain flex-1 tt-scrollbar-none">
                        <div className="sticky top-0 z-10 flex justify-center pt-2.5 pb-1 pointer-events-none">
                            <span className="w-10 h-1.5 rounded-full" style={{ background: "rgba(127,110,90,0.45)" }} />
                        </div>

                        <div className="px-4 pt-1">
                            <MediaCarousel images={dish.media.images} video={dish.media.video} aspect="4 / 3" />
                        </div>

                        <div className="px-5 pt-5 pb-28 flex flex-col gap-7">
                            <header className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {section && <span className="tt-eyebrow">{section.name}</span>}
                                    {tag && (
                                        <span className="tt-badge" data-tone="saffron">
                                            {tag}
                                        </span>
                                    )}
                                </div>
                                <SheetTitle className="tt-display text-[30px] leading-[1.05] text-[var(--tt-ink)] font-medium">
                                    {dish.name}
                                </SheetTitle>
                                <div className="text-sm text-[var(--tt-ink-3)]">
                                    <span className="italic">{dish.thaiName}</span>
                                    <span className="mx-1.5">·</span>
                                    <span>say it: {dish.pronunciation}</span>
                                </div>
                                <SheetDescription className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">
                                    {dish.tagline}
                                </SheetDescription>
                                <div className="flex items-center gap-4 flex-wrap pt-1">
                                    <span className="tt-display-sm text-[22px] text-[var(--tt-ink)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                                        Rs {dish.price}
                                    </span>
                                    <Rating avg={dish.rating.avg} count={dish.rating.count} />
                                    <SpiceMeter level={dish.spice} adjustable={dish.spiceAdjustable} />
                                </div>
                            </header>

                            <div className="grid grid-cols-3 gap-2">
                                <Meta icon={<UtensilsCrossed size={14} />} label="Portion" value={dish.portion} />
                                <Meta icon={<Users size={14} />} label="Serves" value={dish.serves} />
                                <Meta icon={<Clock size={14} />} label="Kitchen" value={`${dish.prepMinutes} min`} />
                            </div>

                            <Section title="What arrives at the table">
                                <p className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{dish.description}</p>
                            </Section>

                            <Section title="Tastes like">
                                <p className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{dish.tastesLike}</p>
                                <p className="text-sm text-[var(--tt-ink-3)] mt-1.5">Texture: {dish.texture}</p>
                                <div className="mt-4 grid grid-cols-5 gap-2">
                                    {(["sweet", "sour", "salty", "rich", "fresh"] as const).map((k) => (
                                        <div key={k} className="flex flex-col gap-1.5">
                                            <div className="tt-bar">
                                                <i style={{ width: `${(dish.profile[k] / 5) * 100}%` }} />
                                            </div>
                                            <span className="text-[11px] text-[var(--tt-ink-3)] capitalize">{k}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            <Section title="How to eat it">
                                <ol className="tt-steps flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--tt-ink-2)]">
                                    {dish.howToEat.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </Section>

                            <Section title="The story">
                                <p className="text-[15px] leading-relaxed text-[var(--tt-ink-2)]">{dish.story}</p>
                            </Section>

                            <Section title="Inside the bowl">
                                <div className="flex flex-wrap gap-1.5">
                                    {dish.keyIngredients.map((ing) => (
                                        <span key={ing} className="tt-badge">
                                            {ing}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {dish.dietary.map((d) => (
                                        <span key={d} className="tt-badge" data-tone={DIETARY_TONE[d]} title={restaurant.dietaryLegend[d]}>
                                            {prettyTag(d)}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--tt-ink-3)] mt-3">
                                    Allergens listed: {dish.allergens.length ? dish.allergens.join(", ") : "none"}. Anything not listed here, please check with your server.
                                </p>
                            </Section>

                            {pairs.length > 0 && (
                                <Section title="Goes well with">
                                    <div className="flex flex-col gap-2">
                                        {pairs.map((p) => {
                                            const cover = p.media.images[0]
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => onOpenDish(p)}
                                                    className="tt-card flex items-center gap-3 p-2 pr-4 text-left"
                                                >
                                                    {cover && (
                                                        <SmartImage src={cover.src} alt={cover.alt} className="w-16 h-16 rounded-[12px] shrink-0" />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="tt-display-sm text-[15px] leading-tight truncate">{p.name}</div>
                                                        <div className="text-xs text-[var(--tt-ink-3)] truncate mt-0.5">{p.tagline}</div>
                                                    </div>
                                                    <span className="text-xs text-[var(--tt-ink-2)] shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                                                        Rs {p.price}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </Section>
                            )}

                            {dish.reviews.length > 0 && (
                                <Section title="Guests say">
                                    <div className="flex flex-col gap-3">
                                        {dish.reviews.map((r) => (
                                            <figure key={r.quote} className="rounded-[var(--tt-radius-sm)] p-3.5" style={{ background: "var(--tt-paper-2)" }}>
                                                <blockquote className="tt-display-sm text-[15px] leading-snug text-[var(--tt-ink)]">
                                                    {"“"}
                                                    {r.quote}
                                                    {"”"}
                                                </blockquote>
                                                <figcaption className="text-xs text-[var(--tt-ink-3)] mt-2">
                                                    {r.by} · {r.when}
                                                </figcaption>
                                            </figure>
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </div>
                    </div>
                )}

                {dish && (
                    <div className="tt-composer absolute bottom-0 left-0 right-0 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
                        <div className="flex items-center gap-2 mb-2 text-xs text-[var(--tt-ink-3)]">
                            <MessageCircleQuestion size={13} /> Ask Noi about this dish
                        </div>
                        <div className="flex gap-2 overflow-x-auto tt-scrollbar-none -mx-4 px-4">
                            {quick.map((q) => (
                                <button key={q.label} type="button" className="tt-chip shrink-0" onClick={() => onAsk(q.q)}>
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2.5">
            <h3 className="tt-eyebrow">{title}</h3>
            {children}
        </section>
    )
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[var(--tt-radius-sm)] px-3 py-2.5 flex flex-col gap-1" style={{ background: "var(--tt-paper-2)" }}>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--tt-ink-3)]">
                {icon} {label}
            </span>
            <span className="text-[13px] leading-snug text-[var(--tt-ink)]">{value}</span>
        </div>
    )
}
