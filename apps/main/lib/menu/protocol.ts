import type { HostReply } from "./types"

function extractJsonObject(text: string): string | null {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const candidate = fenced?.[1] ?? text
    const start = candidate.indexOf("{")
    const end = candidate.lastIndexOf("}")
    if (start === -1 || end === -1 || end <= start) return null
    return candidate.slice(start, end + 1)
}

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return []
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim())
}

export function parseHostReply(raw: string, validDishIds: Set<string>): HostReply {
    const fallback: HostReply = { say: raw.trim(), show: [], ask: null, remember: [] }
    const json = extractJsonObject(raw)
    if (!json) return fallback

    let obj: Record<string, unknown>
    try {
        obj = JSON.parse(json)
    } catch {
        return fallback
    }

    const say = typeof obj.say === "string" ? obj.say.trim() : ""
    const show = asStringArray(obj.show).filter((id) => validDishIds.has(id)).slice(0, 4)

    let ask: HostReply["ask"] = null
    const rawAsk = obj.ask
    if (rawAsk && typeof rawAsk === "object") {
        const a = rawAsk as Record<string, unknown>
        const question = typeof a.question === "string" ? a.question.trim() : ""
        const options = asStringArray(a.options).slice(0, 4)
        if (question && options.length >= 2) ask = { question, options }
    }

    const remember = asStringArray(obj.remember).slice(0, 12)

    return {
        say: say || (show.length ? "" : fallback.say),
        show,
        ask,
        remember,
    }
}
