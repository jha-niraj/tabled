"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@repo/ui/components/ui/sheet"
import type { Dish, Restaurant } from "@/lib/menu/types"
import { DishDetail } from "./dish-sheet"
import { MenuList } from "./menu-sheet"

export type ExplorerView = { kind: "menu" } | { kind: "dish"; dish: Dish }

type Props = {
    restaurant: Restaurant
    open: boolean
    stack: ExplorerView[]
    onStackChange: (stack: ExplorerView[]) => void
    onOpenChange: (open: boolean) => void
    onAsk: (question: string) => void
}

function viewKey(v: ExplorerView) {
    return v.kind === "menu" ? "menu" : `dish:${v.dish.id}`
}

export function ExplorerSheet({ restaurant, open, stack, onStackChange, onOpenChange, onAsk }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const savedScroll = useRef<Map<string, number>>(new Map())
    const [direction, setDirection] = useState<1 | -1>(1)
    const current = stack[stack.length - 1]
    const canGoBack = stack.length > 1

    const push = (view: ExplorerView) => {
        if (current && scrollRef.current) savedScroll.current.set(viewKey(current), scrollRef.current.scrollTop)
        setDirection(1)
        onStackChange([...stack, view])
    }

    const pop = () => {
        if (!canGoBack) return
        setDirection(-1)
        onStackChange(stack.slice(0, -1))
    }

    // Restore the list's position when coming back, start a dish at the top
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (!el || !current) return
        const saved = direction === -1 ? savedScroll.current.get(viewKey(current)) : undefined
        el.scrollTop = saved ?? 0
    }, [current, direction])

    useEffect(() => {
        if (!open) savedScroll.current.clear()
    }, [open])

    const title = current?.kind === "dish" ? current.dish.name : "Full menu"

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="tt tt-sheet p-0 h-[92dvh] rounded-t-[28px] border-t sm:max-w-xl sm:mx-auto overflow-hidden flex flex-col gap-0">
                <SheetTitle className="sr-only">{title}</SheetTitle>
                <SheetDescription className="sr-only">{current?.kind === "dish" ? current.dish.tagline : restaurant.name}</SheetDescription>

                <div ref={scrollRef} className="overflow-y-auto overscroll-contain flex-1 tt-scrollbar-none relative">
                    <div className="sticky top-0 z-10 h-9 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-1.5 rounded-full" style={{ background: "rgba(127,110,90,0.45)" }} />
                        {canGoBack && (
                            <button
                                type="button"
                                onClick={pop}
                                aria-label="Back"
                                className="pointer-events-auto absolute left-3 top-1.5 inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 h-8 text-xs font-medium"
                                style={{ background: "color-mix(in oklab, var(--tt-paper) 80%, transparent)", backdropFilter: "blur(10px)", border: "1px solid var(--tt-line)", color: "var(--tt-ink)" }}
                            >
                                <ArrowLeft size={14} /> {stack[stack.length - 2]?.kind === "menu" ? "Menu" : "Back"}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        {current && (
                            <motion.div
                                key={viewKey(current)}
                                initial={{ opacity: 0, x: 24 * direction }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 * direction }}
                                transition={{ duration: 0.14, ease: "easeOut" }}
                            >
                                {current.kind === "menu" ? (
                                    <MenuList restaurant={restaurant} onOpenDish={(d) => push({ kind: "dish", dish: d })} />
                                ) : (
                                    <DishDetail
                                        dish={current.dish}
                                        restaurant={restaurant}
                                        onOpenDish={(d) => push({ kind: "dish", dish: d })}
                                        onAsk={onAsk}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    )
}
