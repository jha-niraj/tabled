"use client"

import { Mic, Square } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { useRecorder } from "./use-recorder"

type Props = {
    disabled?: boolean
    onTranscript: (text: string, languageCode: string | null) => void
    onError: (message: string) => void
}

export function MicButton({ disabled, onTranscript, onError }: Props) {
    const { state, elapsedMs, start, stop } = useRecorder({
        maxMs: 25000,
        onClip: async (blob) => {
            const form = new FormData()
            form.append("audio", blob, "clip.webm")
            const res = await fetch("/api/menu/stt", { method: "POST", body: form })
            const data = (await res.json().catch(() => ({}))) as { transcript?: string; languageCode?: string | null; error?: string }
            if (!res.ok || !data.transcript) {
                onError(data.error ?? "I could not catch that. Try once more, a little closer to the mic.")
                return
            }
            onTranscript(data.transcript, data.languageCode ?? null)
        },
    })

    if (state === "unsupported") return null

    const recording = state === "recording"
    const processing = state === "processing"
    const seconds = Math.floor(elapsedMs / 1000)

    return (
        <div className="relative flex items-center">
            {recording && (
                <span
                    className="absolute right-full mr-2 text-xs whitespace-nowrap text-[var(--tt-chili)]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    listening {seconds}s
                </span>
            )}
            <button
                type="button"
                disabled={disabled || processing}
                onClick={() => (recording ? stop() : start())}
                aria-label={recording ? "Stop recording" : "Speak to Noi"}
                className={cn(
                    "inline-flex items-center justify-center rounded-full transition-all duration-200",
                    recording ? "tt-pulse text-white" : "text-[var(--tt-ink)]",
                )}
                style={{
                    width: 40,
                    height: 40,
                    background: recording ? "var(--tt-chili)" : "var(--tt-paper-2)",
                    border: "1px solid var(--tt-line-2)",
                    opacity: processing ? 0.6 : 1,
                }}
            >
                {processing ? (
                    <span className="tt-typing" style={{ transform: "scale(0.7)", marginLeft: 4 }}>
                        <span />
                        <span />
                        <span />
                    </span>
                ) : recording ? (
                    <Square size={14} fill="currentColor" />
                ) : (
                    <Mic size={17} />
                )}
            </button>
        </div>
    )
}
