import { NextResponse } from "next/server"
import { buildSystemPrompt, getDishesByIds, getRestaurant } from "@/lib/menu/knowledge"
import { parseHostReply } from "@/lib/menu/protocol"
import { sarvamChat } from "@/lib/menu/sarvam"
import type { ChatResponse, ChatTurn } from "@/lib/menu/types"

export const runtime = "nodejs"

const MAX_TURNS = 16
const MAX_TURN_CHARS = 2000

type Body = { slug?: string; turns?: ChatTurn[]; remember?: string[]; languageHint?: string | null }

export async function POST(req: Request) {
    let body: Body
    try {
        body = (await req.json()) as Body
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const restaurant = getRestaurant(body.slug ?? "")
    if (!restaurant) return NextResponse.json({ error: "Unknown restaurant" }, { status: 404 })

    const turns = (body.turns ?? [])
        .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
        .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURN_CHARS) }))
        .slice(-MAX_TURNS)

    if (turns.length === 0 || turns[turns.length - 1]!.role !== "user") {
        return NextResponse.json({ error: "Last turn must be from the user" }, { status: 400 })
    }

    const remember = (body.remember ?? []).filter((s) => typeof s === "string").slice(0, 12)
    const languageHint = typeof body.languageHint === "string" && /^[a-z]{2}-[A-Z]{2}$/.test(body.languageHint) ? body.languageHint : null
    const extras: string[] = []
    if (remember.length) extras.push(`WHAT YOU ALREADY KNOW ABOUT THIS GUEST\n${remember.map((r) => `- ${r}`).join("\n")}`)
    if (languageHint && languageHint !== "en-IN") {
        extras.push(`The guest just spoke in language code ${languageHint}. Reply in that language, in its native script, keeping dish names as written on the menu.`)
    }
    const system = extras.length ? `${buildSystemPrompt(restaurant)}\n\n${extras.join("\n\n")}` : buildSystemPrompt(restaurant)

    try {
        const { content } = await sarvamChat(system, turns)
        const validIds = new Set(restaurant.dishes.map((d) => d.id))
        const reply = parseHostReply(content, validIds)
        const dishes = getDishesByIds(restaurant, reply.show)
        const payload: ChatResponse = { reply, dishes, raw: content }
        return NextResponse.json(payload)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Chat failed"
        console.error("[menu/chat]", message)
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
