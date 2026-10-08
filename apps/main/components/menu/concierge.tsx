"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, BookOpen, Info, Mic } from "lucide-react"
import type { AskPrompt, ChatResponse, ChatTurn, Dish, Restaurant } from "@/lib/menu/types"
import { DishRail } from "./dish-card"
import { DishSheet } from "./dish-sheet"
import { ChoiceChips } from "./choice-chips"
import { MicButton } from "./mic-button"
import { RestaurantSheet } from "./restaurant-sheet"
import { MenuSheet } from "./menu-sheet"
import { HostMark } from "./host-mark"
import { Rating } from "./rating"
import { SmartImage } from "./smart-image"

type Message = {
    id: string
    role: "user" | "assistant"
    text: string
    dishes?: Dish[]
    ask?: AskPrompt | null
    raw?: string
    pending?: boolean
    error?: boolean
    viaVoice?: boolean
    languageCode?: string | null
    answered?: string
}

const LANG_LABEL: Record<string, string> = {
    "hi-IN": "Hindi",
    "en-IN": "English",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "bn-IN": "Bengali",
    "gu-IN": "Gujarati",
    "pa-IN": "Punjabi",
    "od-IN": "Odia",
}

let counter = 0
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`

export function Concierge({ restaurant }: { restaurant: Restaurant }) {
    const mostLoved = useMemo(
        () => restaurant.mostLoved.map((id) => restaurant.dishes.find((d) => d.id === id)).filter((d): d is Dish => !!d),
        [restaurant],
    )

    const welcome = useMemo<Message>(
        () => ({
            id: "welcome",
            role: "assistant",
            text: restaurant.welcome.intro,
            dishes: mostLoved,
            ask: restaurant.welcome.firstQuestion,
            raw: JSON.stringify({
                say: restaurant.welcome.intro,
                show: restaurant.mostLoved,
                ask: restaurant.welcome.firstQuestion,
                remember: [],
            }),
        }),
        [restaurant, mostLoved],
    )

    const [messages, setMessages] = useState<Message[]>([welcome])
    const messagesRef = useRef(messages)
    messagesRef.current = messages
    const [remember, setRemember] = useState<string[]>([])
    const rememberRef = useRef(remember)
    rememberRef.current = remember
    const [input, setInput] = useState("")
    const [busy, setBusy] = useState(false)
    const [heard, setHeard] = useState<string | null>(null)

    const [activeDish, setActiveDish] = useState<Dish | null>(null)
    const [dishOpen, setDishOpen] = useState(false)
    const [infoOpen, setInfoOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages.length, busy])

    const openDish = useCallback((d: Dish) => {
        setActiveDish(d)
        setDishOpen(true)
    }, [])

    const send = useCallback(
        async (text: string, opts: { viaVoice?: boolean; languageCode?: string | null; answering?: string } = {}) => {
            const clean = text.trim()
            if (!clean || busy) return
            setBusy(true)
            setInput("")

            const userMsg: Message = { id: nextId(), role: "user", text: clean, viaVoice: opts.viaVoice, languageCode: opts.languageCode ?? null }
            const pendingId = nextId()
            const history = messagesRef.current

            setMessages((prev) => [
                ...prev.map((m) => (opts.answering && m.id === opts.answering ? { ...m, answered: clean } : m)),
                userMsg,
                { id: pendingId, role: "assistant", text: "", pending: true },
            ])

            const turns: ChatTurn[] = [...history, userMsg]
                .filter((m) => !m.pending && !m.error)
                .map((m) => ({
                    role: m.role,
                    content:
                        m.role === "assistant"
                            ? (m.raw ?? JSON.stringify({ say: m.text, show: m.dishes?.map((d) => d.id) ?? [], ask: m.ask ?? null, remember: rememberRef.current }))
                            : m.text,
                }))

            try {
                const res = await fetch("/api/menu/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ slug: restaurant.slug, turns, remember: rememberRef.current, languageHint: opts.languageCode ?? null }),
                })
                const data = (await res.json()) as ChatResponse & { error?: string }
                if (!res.ok || !data.reply) throw new Error(data.error ?? "Chat failed")

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === pendingId
                            ? { id: pendingId, role: "assistant", text: data.reply.say, dishes: data.dishes, ask: data.reply.ask, raw: data.raw }
                            : m,
                    ),
                )
                if (data.reply.remember.length) setRemember(data.reply.remember)
            } catch (err) {
                console.error("[concierge]", err)
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === pendingId
                            ? { id: pendingId, role: "assistant", text: "I lost the thread for a second. Say that again?", error: true }
                            : m,
                    ),
                )
            } finally {
                setBusy(false)
            }
        },
        [busy, restaurant.slug],
    )

    const askFromSheet = useCallback(
        (q: string) => {
            setDishOpen(false)
            setMenuOpen(false)
            window.setTimeout(() => void send(q), 180)
        },
        [send],
    )

    const hero = restaurant.media.hero[0]

    return (
        <div className="min-h-dvh flex flex-col">
            <header className="sticky top-0 z-20 tt-composer border-b" style={{ borderColor: "var(--tt-line)" }}>
                <div className="mx-auto max-w-xl px-4 h-14 flex items-center justify-between gap-3">
                    <button type="button" onClick={() => setInfoOpen(true)} className="flex items-center gap-2.5 min-w-0 text-left">
                        <span className="tt-display text-[19px] leading-none truncate">{restaurant.name}</span>
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--tt-ink-3)]">
                            <Rating avg={restaurant.ratings.overall} count={restaurant.ratings.totalReviews} compact />
                        </span>
                    </button>
                    <div className="flex items-center gap-1.5">
                        <IconButton label="Full menu" onClick={() => setMenuOpen(true)}>
                            <BookOpen size={17} />
                        </IconButton>
                        <IconButton label="About the restaurant" onClick={() => setInfoOpen(true)}>
                            <Info size={17} />
                        </IconButton>
                    </div>
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-xl px-4 pb-36">
                <section className="pt-5 pb-2">
                    <motion.div
                        className="relative rounded-[var(--tt-radius)] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        {hero && <SmartImage src={hero.src} alt={hero.alt} priority style={{ aspectRatio: "16 / 9" }} />}
                        <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(180deg, rgba(20,14,10,0.05) 20%, rgba(20,14,10,0.78) 100%)" }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                            <div className="tt-eyebrow" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {restaurant.tagline}
                            </div>
                            <h1 className="tt-display text-[28px] sm:text-[32px] leading-[1.08] mt-1.5">{restaurant.welcome.greeting}</h1>
                        </div>
                    </motion.div>
                </section>

                <div className="flex flex-col gap-7 pt-4">
                    {messages.map((m, i) => (
                        <MessageView
                            key={m.id}
                            message={m}
                            isLast={i === messages.length - 1}
                            busy={busy}
                            onOpenDish={openDish}
                            onPick={(opt) => void send(opt, { answering: m.id })}
                        />
                    ))}
                </div>
                <div ref={bottomRef} className="h-1" />
                <p className="pt-10 pb-2 text-center text-[11px] tracking-[0.14em] uppercase text-[var(--tt-ink-4)]">Tabled · your table host</p>
            </main>

            <div className="fixed bottom-0 inset-x-0 z-20 tt-composer">
                <div className="mx-auto max-w-xl px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]">
                    <AnimatePresence>
                        {heard && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                className="mb-2 inline-flex items-center gap-1.5 text-xs text-[var(--tt-ink-3)]"
                            >
                                <Mic size={11} /> {heard}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault()
                            void send(input)
                        }}
                    >
                        <div className="tt-input flex-1 flex items-center gap-2 pl-4 pr-1.5 h-12">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Noi anything, in any language"
                                autoComplete="off"
                                enterKeyHint="send"
                                disabled={busy}
                            />
                            <button
                                type="submit"
                                disabled={busy || !input.trim()}
                                aria-label="Send"
                                className="inline-flex items-center justify-center rounded-full transition-opacity disabled:opacity-30"
                                style={{ width: 36, height: 36, background: "var(--tt-ink)", color: "var(--tt-paper)" }}
                            >
                                <ArrowUp size={17} />
                            </button>
                        </div>
                        <MicButton
                            disabled={busy}
                            onTranscript={(text, lang) => {
                                const label = lang ? LANG_LABEL[lang] ?? lang : null
                                setHeard(label ? `Heard you in ${label}` : "Heard you")
                                window.setTimeout(() => setHeard(null), 3500)
                                void send(text, { viaVoice: true, languageCode: lang })
                            }}
                            onError={(msg) => {
                                setHeard(msg)
                                window.setTimeout(() => setHeard(null), 4000)
                            }}
                        />
                    </form>
                </div>
            </div>

            <DishSheet
                dish={activeDish}
                restaurant={restaurant}
                open={dishOpen}
                onOpenChange={setDishOpen}
                onOpenDish={(d) => setActiveDish(d)}
                onAsk={askFromSheet}
            />
            <RestaurantSheet restaurant={restaurant} open={infoOpen} onOpenChange={setInfoOpen} />
            <MenuSheet
                restaurant={restaurant}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                onOpenDish={(d) => {
                    setMenuOpen(false)
                    window.setTimeout(() => openDish(d), 150)
                }}
            />
        </div>
    )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="inline-flex items-center justify-center rounded-full text-[var(--tt-ink-2)] transition-colors hover:text-[var(--tt-ink)]"
            style={{ width: 36, height: 36, background: "var(--tt-paper-2)", border: "1px solid var(--tt-line)" }}
        >
            {children}
        </button>
    )
}

function MessageView({
    message: m,
    isLast,
    busy,
    onOpenDish,
    onPick,
}: {
    message: Message
    isLast: boolean
    busy: boolean
    onOpenDish: (d: Dish) => void
    onPick: (opt: string) => void
}) {
    if (m.role === "user") {
        return (
            <motion.div className="flex justify-end" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <div className="tt-user-bubble">
                    {m.viaVoice && <Mic size={12} className="inline mr-1.5 -mt-0.5 opacity-70" />}
                    {m.text}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-start gap-3">
                <HostMark />
                <div className="flex-1 min-w-0 pt-0.5">
                    {m.pending ? (
                        <div className="tt-typing pt-2" aria-label="Noi is thinking">
                            <span />
                            <span />
                            <span />
                        </div>
                    ) : (
                        <p
                            className="text-[16px] leading-[1.55] whitespace-pre-line"
                            style={{ color: m.error ? "var(--tt-chili)" : "var(--tt-ink)" }}
                        >
                            {m.text}
                        </p>
                    )}
                </div>
            </div>

            {m.dishes && m.dishes.length > 0 && (
                <div className="pl-0 sm:pl-10">
                    {m.id === "welcome" && <div className="tt-eyebrow mb-2.5">Most loved at this table</div>}
                    <DishRail dishes={m.dishes} onOpen={onOpenDish} />
                </div>
            )}

            {m.ask && (
                <div className="pl-0 sm:pl-10 flex flex-col gap-2.5">
                    <p className="tt-display-sm text-[18px] leading-snug text-[var(--tt-ink)]">{m.ask.question}</p>
                    <ChoiceChips options={m.ask.options} selected={m.answered} disabled={busy || (!isLast && !m.answered)} onPick={onPick} />
                </div>
            )}
        </motion.div>
    )
}
