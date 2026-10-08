"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState = "idle" | "recording" | "processing" | "unsupported"

type Options = {
    maxMs?: number
    onClip: (blob: Blob) => Promise<void> | void
}

function pickMimeType(): string {
    if (typeof MediaRecorder === "undefined") return ""
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
    return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? ""
}

export function useRecorder({ maxMs = 25000, onClip }: Options) {
    const [state, setState] = useState<RecorderState>("idle")
    const [elapsedMs, setElapsedMs] = useState(0)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const tickRef = useRef<number | null>(null)
    const startedAtRef = useRef(0)
    const onClipRef = useRef(onClip)
    onClipRef.current = onClip

    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            setState("unsupported")
        }
    }, [])

    const clearTick = () => {
        if (tickRef.current !== null) {
            window.clearInterval(tickRef.current)
            tickRef.current = null
        }
    }

    const stop = useCallback(() => {
        const rec = recorderRef.current
        if (rec && rec.state !== "inactive") rec.stop()
    }, [])

    const start = useCallback(async () => {
        if (state !== "idle") return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const mimeType = pickMimeType()
            const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
            chunksRef.current = []
            rec.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }
            rec.onstop = async () => {
                clearTick()
                stream.getTracks().forEach((t) => t.stop())
                streamRef.current = null
                recorderRef.current = null
                const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" })
                chunksRef.current = []
                if (blob.size === 0) {
                    setState("idle")
                    return
                }
                setState("processing")
                try {
                    await onClipRef.current(blob)
                } finally {
                    setState("idle")
                    setElapsedMs(0)
                }
            }
            recorderRef.current = rec
            rec.start(250)
            startedAtRef.current = Date.now()
            setElapsedMs(0)
            setState("recording")
            tickRef.current = window.setInterval(() => {
                const ms = Date.now() - startedAtRef.current
                setElapsedMs(ms)
                if (ms >= maxMs) stop()
            }, 100)
        } catch (err) {
            console.error("[recorder]", err)
            setState("idle")
        }
    }, [state, maxMs, stop])

    useEffect(() => {
        return () => {
            clearTick()
            streamRef.current?.getTracks().forEach((t) => t.stop())
        }
    }, [])

    return { state, elapsedMs, start, stop }
}
