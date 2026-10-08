import { NextResponse } from "next/server"
import { sarvamTranscribe } from "@/lib/menu/sarvam"

export const runtime = "nodejs"

const MAX_AUDIO_BYTES = 8 * 1024 * 1024

export async function POST(req: Request) {
    let form: FormData
    try {
        form = await req.formData()
    } catch {
        return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
    }

    const audio = form.get("audio")
    if (!(audio instanceof Blob) || audio.size === 0) {
        return NextResponse.json({ error: "No audio received" }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
        return NextResponse.json({ error: "Recording too large" }, { status: 413 })
    }

    const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm"

    try {
        const result = await sarvamTranscribe(audio, `clip.${ext}`)
        return NextResponse.json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Transcription failed"
        console.error("[menu/stt]", message)
        return NextResponse.json({ error: message }, { status: 502 })
    }
}
