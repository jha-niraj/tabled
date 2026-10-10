// ─── Sarvam Doc AI (v1) core client - shared by every worker that OCRs ───────────
//
// The CURRENT Doc AI API (doc-ai/v1), not the deprecated doc-digitization/job/v1 or the
// legacy /parse/parsepdf endpoint. One async job:
//   1. submit          POST /doc-ai/v1/job/digitise        (ONE multipart request)
//   2. poll status     GET  /doc-ai/v1/job/{id}/status      -> { status, usage }
//   3. mint + fetch    GET  /doc-ai/v1/job/{id}/download-url -> { url, headers? }
//
// Digitise takes PDF / JPEG / PNG / ZIP-of-images (<= 50 MB) with a hard 10-page-per-job
// limit; a caller that needs more pages splits upstream and runs one job per part. This
// module is domain-neutral: it runs ONE job and returns the rendered output file(s). It
// knows nothing about PDFs-vs-page-splitting, R2, or the DB - those stay in each worker.

import { unzipSync } from "fflate"

const BASE = "https://api.sarvam.ai/doc-ai/v1"
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 5 * 60 * 1000
const MAX_RETRIES = 6
// Terminal job states (lowercase in doc-ai/v1).
const TERMINAL = new Set(["completed", "partially_completed", "failed", "rejected"])

// Sarvam's hard per-job page ceiling. Exported so a caller that OCRs multi-page files can
// split into parts of this size before calling runDigitiseJob once per part.
export const SARVAM_PAGES_PER_JOB = 10

export type SarvamOutputFormat = "html" | "md"
// Gates Sarvam's vision model: "printed" for gazettes/acts, "handwritten" for student copies.
export type SarvamContentType = "printed" | "handwritten"

// Input shapes Sarvam accepts, detected from magic bytes (not extension) so a mislabeled
// upload still routes correctly.
export type DocKind = "pdf" | "png" | "jpg" | "zip"

export function detectDocKind(bytes: Uint8Array): DocKind {
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf" // %PDF
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png" // PNG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg" // JPEG
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "zip" // PK..
    return "pdf"
}

export function contentTypeForKind(kind: DocKind): string {
    switch (kind) {
        case "png": return "image/png"
        case "jpg": return "image/jpeg"
        case "zip": return "application/zip"
        case "pdf": return "application/pdf"
    }
}

function extForKind(kind: DocKind): string {
    return kind === "jpg" ? "jpg" : kind
}

export interface SarvamJobOptions {
    apiKey: string
    language?: string // BCP-47, defaults to "ne-IN"
    outputFormat?: SarvamOutputFormat // defaults to "html"
    contentType?: SarvamContentType // defaults to "printed"
    autoOrient?: boolean // defaults to true (fixes rotated scans before OCR)
    // Optional overrides; derived from the detected doc kind when omitted.
    fileName?: string
    mime?: string
    // Progress logger; defaults to console.log. Pass a no-op to silence.
    log?: (message: string) => void
}

export interface SarvamOutputFile {
    name: string
    kind: "html" | "md" | "json" | "other"
    text: string
}

// The result of ONE digitise job.
export interface SarvamJobResult {
    jobId: string
    jobState: string
    pagesProcessed: number
    pagesSucceeded: number
    pagesFailed: number
    files: SarvamOutputFile[]
}

interface SubmitResponse { job_id: string }
interface JobStatusResponse {
    status: string
    usage?: { pages_processed?: number; pages_total?: number }
}
interface DownloadUrlResponse {
    url: string
    headers?: Record<string, string>
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Sarvam rate-limits (~10 req/min) and a large corpus is many jobs, so 429/5xx are
// expected. Back off (honouring Retry-After) instead of failing the whole document.
function backoffMs(res: Response, attempt: number): number {
    const retryAfter = Number(res.headers.get("retry-after"))
    return Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(60_000, 2_000 * 2 ** attempt)
}

// Retrying fetch for IDEMPOTENT GETs (status / download-url). Returns the Response.
async function fetchWithRetry(url: string, init: RequestInit, label: string, log: (m: string) => void): Promise<Response> {
    let attempt = 0
    for (;;) {
        const res = await fetch(url, init)
        if (res.status !== 429 && res.status < 500) return res
        if (attempt >= MAX_RETRIES) return res
        const backoff = backoffMs(res, attempt)
        log(`[sarvam] ${label} HTTP ${res.status}; retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms`)
        await sleep(backoff)
        attempt++
    }
}

async function sarvamGet<T>(path: string, apiKey: string, label: string, log: (m: string) => void): Promise<T> {
    const res = await fetchWithRetry(`${BASE}${path}`, { headers: { "api-subscription-key": apiKey } }, label, log)
    if (!res.ok) {
        const detail = await res.text().catch(() => "")
        throw new Error(`Sarvam GET ${path} failed: HTTP ${res.status} ${detail}`)
    }
    return (await res.json()) as T
}

function classify(name: string): SarvamOutputFile["kind"] {
    const lower = name.toLowerCase()
    if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html"
    if (lower.endsWith(".md")) return "md"
    if (lower.endsWith(".json")) return "json"
    return "other"
}

function isZip(bytes: Uint8Array): boolean {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04 // PK\x03\x04
}

interface ResolvedOptions {
    apiKey: string
    language: string
    outputFormat: SarvamOutputFormat
    contentType: SarvamContentType
    autoOrient: boolean
    fileName: string
    mime: string
    log: (message: string) => void
}

function resolveOptions(bytes: Uint8Array, options: SarvamJobOptions): ResolvedOptions {
    const kind = detectDocKind(bytes)
    return {
        apiKey: options.apiKey,
        language: options.language ?? "ne-IN",
        outputFormat: options.outputFormat ?? "html",
        contentType: options.contentType ?? "printed",
        autoOrient: options.autoOrient ?? true,
        fileName: options.fileName ?? `document.${extForKind(kind)}`,
        mime: options.mime ?? contentTypeForKind(kind),
        log: options.log ?? ((m: string) => console.log(m)),
    }
}

// Submit one digitise job (multipart). FormData is rebuilt per attempt because a sent body
// is consumed and cannot be replayed. Returns the job id.
async function submitDigitise(bytes: Uint8Array, opts: ResolvedOptions): Promise<string> {
    let attempt = 0
    for (;;) {
        const form = new FormData()
        // .slice() copies into a fresh, non-shared ArrayBuffer, sidestepping the ArrayBufferLike
        // vs ArrayBuffer mismatch the strict DOM lib flags on a raw Uint8Array BlobPart.
        form.append("file", new Blob([bytes.slice().buffer as ArrayBuffer], { type: opts.mime }), opts.fileName)
        form.append("language", opts.language)
        form.append("output_format", opts.outputFormat)
        form.append("content_type", opts.contentType)
        form.append("auto_orient", opts.autoOrient ? "true" : "false")
        // Do NOT set content-type manually: fetch derives the multipart boundary from the body.
        const res = await fetch(`${BASE}/job/digitise`, {
            method: "POST",
            headers: { "api-subscription-key": opts.apiKey },
            body: form,
        })
        if (res.ok) return ((await res.json()) as SubmitResponse).job_id
        if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
            const backoff = backoffMs(res, attempt)
            opts.log(`[sarvam] digitise HTTP ${res.status}; retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms`)
            await sleep(backoff)
            attempt++
            continue
        }
        const detail = await res.text().catch(() => "")
        throw new Error(`Sarvam digitise submit failed: HTTP ${res.status} ${detail}`)
    }
}

// ─── The three steps, exported ──────────────────────────────────────────────────
//
// `runDigitiseJob` below blocks until the job is terminal, which is right for a script or a
// short synchronous request and IMPOSSIBLE inside a Cloudflare Durable Object: reading a
// multi-page answer sheet routinely outlives a request, and a poll loop is exactly what got
// killed mid-flight before the work moved onto alarm ticks.
//
// So the loop is not the only way in. A caller that cannot hold a request open drives these
// three itself, one per tick, keeping the job id in its own storage between them.
//
// `runDigitiseJob` is rebuilt on exactly these three. That is the point of splitting them
// rather than writing a second implementation: the blocking path and the resumable path
// cannot drift apart in behaviour, because there is only one behaviour.

/** Step 1. Submit and return the job id. Does NOT wait. */
export async function submitDigitiseJob(bytes: Uint8Array, options: SarvamJobOptions): Promise<string> {
    return submitDigitise(bytes, resolveOptions(bytes, options))
}

export interface SarvamJobStatus {
    /** Raw provider state, lowercase. */
    state: string
    /** True once the job will not change again - completed, partially_completed, failed or rejected. */
    terminal: boolean
    /** True for a terminal state that produced no usable output. */
    failed: boolean
    /** True when the provider finished but could not read part of the document. */
    partial: boolean
    pagesProcessed: number
    pagesTotal: number
}

/** Step 2. ONE status check. No looping, no waiting. */
export async function checkJobStatus(jobId: string, apiKey: string, log?: (m: string) => void): Promise<SarvamJobStatus> {
    const say = log ?? (() => {})
    const status = await sarvamGet<JobStatusResponse>(`/job/${jobId}/status`, apiKey, `status ${jobId}`, say)
    const state = status.status
    const usage = status.usage ?? {}
    return {
        state,
        terminal: TERMINAL.has(state),
        failed: state === "failed" || state === "rejected",
        partial: state === "partially_completed",
        pagesProcessed: usage.pages_processed ?? 0,
        pagesTotal: usage.pages_total ?? 0,
    }
}

/**
 * Step 3. Mint the download URL and fetch the rendered output.
 *
 * Call only once `checkJobStatus` reports terminal and not failed.
 */
export async function fetchJobOutput(
    jobId: string,
    apiKey: string,
    outputFormat: SarvamOutputFormat = "html",
    log?: (m: string) => void,
): Promise<SarvamOutputFile[]> {
    const say = log ?? (() => {})
    const link = await sarvamGet<DownloadUrlResponse>(`/job/${jobId}/download-url`, apiKey, `download-url ${jobId}`, say)
    const dl = await fetch(link.url, { headers: link.headers ?? {} })
    if (!dl.ok) throw new Error(`Sarvam download failed: HTTP ${dl.status}`)
    const raw = new Uint8Array(await dl.arrayBuffer())

    const files: SarvamOutputFile[] = []
    if (isZip(raw)) {
        const entries = unzipSync(raw)
        for (const [innerName, innerBytes] of Object.entries(entries)) {
            if (innerName.endsWith("/")) continue
            files.push({ name: innerName, kind: classify(innerName), text: new TextDecoder().decode(innerBytes) })
        }
    } else {
        files.push({ name: `document.${outputFormat}`, kind: outputFormat, text: new TextDecoder().decode(raw) })
    }
    return files
}

// Run ONE Sarvam digitise job end to end: submit -> poll until terminal -> mint download
// url -> fetch + parse the rendered output file(s). Built on the three steps above.
export async function runDigitiseJob(bytes: Uint8Array, options: SarvamJobOptions): Promise<SarvamJobResult> {
    const opts = resolveOptions(bytes, options)
    const startedAt = Date.now()
    const jobId = await submitDigitise(bytes, opts)
    // Short job id: 8 chars is enough to tell two concurrent jobs apart in a live tail.
    const tag = `[sarvam] ${opts.fileName} ${jobId.slice(0, 8)}`
    const since = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`
    opts.log(`${tag} · submitted ${(bytes.byteLength / 1024).toFixed(0)}KB`)

    // Poll until terminal. Log a state change the moment it happens, else a heartbeat every
    // 5th poll (15s) so a stuck job still shows a pulse instead of going silent.
    let status: SarvamJobStatus | null = null
    let lastState = ""
    let polls = 0
    const deadline = Date.now() + POLL_TIMEOUT_MS
    for (;;) {
        status = await checkJobStatus(jobId, opts.apiKey, opts.log)
        polls++
        if (status.state !== lastState) {
            opts.log(`${tag} · ${status.state} · ${since()}`)
            lastState = status.state
        } else if (polls % 5 === 0) {
            opts.log(`${tag} · still ${status.state} · ${since()}`)
        }
        if (status.terminal) break
        if (Date.now() > deadline) throw new Error(`Sarvam job ${jobId} timed out in state ${status.state}`)
        await sleep(POLL_INTERVAL_MS)
    }
    if (status.failed) throw new Error(`Sarvam job ${jobId} ${status.state}`)

    const files = await fetchJobOutput(jobId, opts.apiKey, opts.outputFormat, opts.log)
    opts.log(`${tag} · ${status.pagesProcessed}/${status.pagesTotal} pages · ${since()} total`)

    return {
        jobId,
        jobState: status.state,
        pagesProcessed: status.pagesProcessed,
        pagesSucceeded: status.pagesProcessed,
        pagesFailed: Math.max(0, status.pagesTotal - status.pagesProcessed),
        files,
    }
}

// Concatenate every output file of a chosen kind (html/md/json) across a job's files.
export function pickOutputText(files: SarvamOutputFile[], kind: SarvamOutputFile["kind"]): string {
    return files.filter((f) => f.kind === kind).map((f) => f.text).join("\n")
}

// Strip HTML tags to plain text so a quality gate / structurer can score Sarvam's output on
// a plain-text basis. Block-level tags become newlines so headings survive on their own line.
//
// ## Two things here are load-bearing and were both wrong before 2026-09-08
//
// 1. **A `<br/>` INSIDE a paragraph is where the scan line wrapped, not a break in the text.**
//    Turning every one into a newline chopped each sentence into 60-character fragments, and a
//    chunker fed fragments embeds fragments. Devanagari does not hyphenate, so joining with a
//    space is always right inside a paragraph; between blocks a newline is still correct.
// 2. **`<[^>]+>` cannot strip an `<img>` whose `alt` contains a raw `>`.** The match ends early
//    and leaves the base64 payload in the output - and on a real page that payload is 92% of the
//    document by weight. Sarvam escapes its entities today, and a maths caption ("5 > 3") is
//    exactly where it would stop. Images are removed first, quote-aware, before anything else.
//
// For structure-aware use - separating prose from figures, keeping section titles as chunk
// boundaries, dropping page furniture - use `parseSarvamDocument` from
// `@repo/core/curriculum/sarvam-page` instead. This function is the flat-text fallback.

/** Matches a whole `<img ...>` tag, quote-aware so a `>` inside an attribute cannot end it early. */
const IMG_TAG_G = /<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi

export function sarvamHtmlToText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        // Images out FIRST, before any tag-shaped regex can trip over an attribute.
        .replace(IMG_TAG_G, "")
        // Inside a paragraph a <br/> is a scan-line wrap: join with a space.
        .replace(/(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi, (_m, open: string, inner: string, close: string) =>
            open + inner.replace(/<br\s*\/?>/gi, " ") + close)
        // Anywhere else a <br/> really is a line break.
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|h[1-6]|li|tr|figcaption|footer)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
}
