"use server"

import { getServerSession } from "@repo/auth"
import {
    uploadFromServer,
    destroyAsset,
    buildUrl,
    thumbnailUrl,
    signUploadParams,
    type CloudinaryUploadResult,
} from "@/lib/cloudinary"

interface ActionResult<T = unknown> {
    success: boolean
    data?: T
    error?: string
}

// ─── Signed upload params ─────────────────────────────────────────────────────
// Use this for LARGE files or BULK uploads where the client uploads directly
// to Cloudinary with a server-generated signature (no file passes through Next.js).
//
// Client usage:
//   const { data } = await getSignedUploadParams({ folder: 'content' })
//   const formData = new FormData()
//   formData.append('file', file)
//   formData.append('api_key', data.apiKey)
//   formData.append('timestamp', String(data.timestamp))
//   formData.append('signature', data.signature)
//   formData.append('folder', data.folder)
//   await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/auto/upload`, {
//     method: 'POST', body: formData
//   })

export async function getSignedUploadParams(options: {
    folder?: string
    resourceType?: string
    tags?: string[]
}): Promise<ActionResult<{
    signature: string
    timestamp: number
    apiKey: string
    cloudName: string
    folder: string
}>> {
    const session = await getServerSession()
    if (!session) return { success: false, error: "Unauthorized" }

    const folder = `${options.folder ?? "uploads"}/${session.user.id}`
    const extraParams: Record<string, string | number> = { folder }
    if (options.tags?.length) extraParams.tags = options.tags.join(",")

    const { signature, timestamp } = signUploadParams(extraParams)

    return {
        success: true,
        data: {
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY!,
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
            folder,
        },
    }
}

// ─── Server-side upload ───────────────────────────────────────────────────────
// Use for uploads that originate on the server (e.g. from a URL, processed file,
// or a small base64 payload from a server action FormData).
// For very large files, prefer getSignedUploadParams() so the file never touches
// your server.

export async function uploadMedia(
    source: string,
    options: {
        folder?: string
        resourceType?: "image" | "video" | "raw" | "auto"
        publicId?: string
        tags?: string[]
    } = {},
): Promise<ActionResult<CloudinaryUploadResult>> {
    const session = await getServerSession()
    if (!session) return { success: false, error: "Unauthorized" }

    try {
        const result = await uploadFromServer(source, {
            folder: `${options.folder ?? "uploads"}/${session.user.id}`,
            resourceType: options.resourceType,
            publicId: options.publicId,
            tags: options.tags,
        })
        return { success: true, data: result }
    } catch (err) {
        console.error("Cloudinary upload error:", err)
        return { success: false, error: "Upload failed. Please try again." }
    }
}

// ─── Upload from FormData (for server actions that receive a file) ─────────────

export async function uploadMediaFromFormData(
    formData: FormData,
    options: {
        field?: string
        folder?: string
        resourceType?: "image" | "video" | "raw" | "auto"
    } = {},
): Promise<ActionResult<CloudinaryUploadResult>> {
    const session = await getServerSession()
    if (!session) return { success: false, error: "Unauthorized" }

    const file = formData.get(options.field ?? "file") as File | null
    if (!file) return { success: false, error: "No file provided" }

    if (file.size > 100 * 1024 * 1024) {
        return { success: false, error: "File exceeds 100 MB limit" }
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`

        const result = await uploadFromServer(dataUri, {
            folder: `${options.folder ?? "uploads"}/${session.user.id}`,
            resourceType: options.resourceType ?? "auto",
        })
        return { success: true, data: result }
    } catch (err) {
        console.error("Cloudinary FormData upload error:", err)
        return { success: false, error: "Upload failed. Please try again." }
    }
}

// ─── Delete an asset ──────────────────────────────────────────────────────────

export async function deleteMedia(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image",
): Promise<ActionResult> {
    const session = await getServerSession()
    if (!session) return { success: false, error: "Unauthorized" }

    try {
        await destroyAsset(publicId, resourceType)
        return { success: true }
    } catch (err) {
        console.error("Cloudinary delete error:", err)
        return { success: false, error: "Delete failed" }
    }
}

// ─── URL helpers (no network call) ────────────────────────────────────────────

export async function getMediaUrl(
    publicId: string,
    transformations: Record<string, unknown> = {},
): Promise<string> {
    return buildUrl(publicId, transformations)
}

export async function getMediaThumbnail(
    publicId: string,
    options?: { width?: number; height?: number; crop?: string },
): Promise<string> {
    return thumbnailUrl(publicId, options)
}
