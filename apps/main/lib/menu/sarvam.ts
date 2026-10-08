import "server-only"
import type { ChatTurn } from "./types"

const SARVAM_BASE = "https://api.sarvam.ai"

function apiKey(): string {
    const key = process.env.SARVAM_API_KEY
    if (!key) throw new Error("SARVAM_API_KEY is not set in apps/main/.env")
    return key
}

export const SARVAM_CHAT_MODEL = process.env.SARVAM_CHAT_MODEL ?? "sarvam-105b"

type ChatOptions = { temperature?: number; maxTokens?: number }

export async function sarvamChat(
    system: string,
    turns: ChatTurn[],
    opts: ChatOptions = {},
): Promise<{ content: string; usage?: Record<string, unknown> }> {
    const res = await fetch(`${SARVAM_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
            "api-subscription-key": apiKey(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: SARVAM_CHAT_MODEL,
            messages: [{ role: "system", content: system }, ...turns],
            temperature: opts.temperature ?? 0.5,
            max_tokens: opts.maxTokens ?? 700,
            // null disables the hidden reasoning pass, which otherwise eats the token budget and adds seconds
            reasoning_effort: null,
            response_format: { type: "json_object" },
        }),
        cache: "no-store",
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Sarvam chat failed (${res.status}): ${text.slice(0, 300)}`)
    }

    const data = (await res.json()) as {
        choices?: { message?: { content?: string | null }; finish_reason?: string }[]
        usage?: Record<string, unknown>
    }
    const content = data.choices?.[0]?.message?.content ?? ""
    return { content, usage: data.usage }
}

export async function sarvamTranscribe(
    file: Blob,
    filename: string,
): Promise<{ transcript: string; languageCode: string | null }> {
    const form = new FormData()
    form.append("file", file, filename)
    form.append("model", "saaras:v4")
    form.append("language_code", "unknown")
    // codemix keeps English words in Latin script inside Indic sentences, which is how people actually talk
    form.append("mode", "codemix")

    const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
        method: "POST",
        headers: { "api-subscription-key": apiKey() },
        body: form,
        cache: "no-store",
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Sarvam speech-to-text failed (${res.status}): ${text.slice(0, 300)}`)
    }

    const data = (await res.json()) as { transcript?: string; language_code?: string | null }
    return { transcript: (data.transcript ?? "").trim(), languageCode: data.language_code ?? null }
}
