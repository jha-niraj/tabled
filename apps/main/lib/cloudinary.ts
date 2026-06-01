/**
 * Cloudinary server-side client
 *
 * For SMALL / SINGLE images (e.g. profile pictures):
 *   Use unsigned client-side upload with NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET. No server round-trip.
 *   See: profile-client.tsx → uploadToCloudinary()
 *
 * For LARGE / BULK images and all non-image files:
 *   Use the signed upload flow:
 *     1. Call getSignedUploadParams() server action → get signature
 *     2. Client POSTs directly to Cloudinary with the signature
 *   Or call uploadToCloudinaryFromServer() for server-side uploads.
 *
 * This file is SERVER-ONLY. Never import it in client components.
 */

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

export default cloudinary

// ─── Typed upload result ────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
    publicId: string
    url: string
    secureUrl: string
    format: string
    resourceType: string
    width?: number
    height?: number
    bytes: number
    folder?: string
    originalFilename?: string
}

// ─── Upload from server (base64 data URI or remote URL) ─────────────────────

export async function uploadFromServer(
    source: string,
    options: {
        folder?: string
        publicId?: string
        resourceType?: "image" | "video" | "raw" | "auto"
        overwrite?: boolean
        tags?: string[]
        transformation?: Record<string, unknown>
    } = {},
): Promise<CloudinaryUploadResult> {
    const result = await cloudinary.uploader.upload(source, {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType ?? "auto",
        overwrite: options.overwrite ?? false,
        tags: options.tags,
        transformation: options.transformation,
    })

    return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder: result.folder,
        originalFilename: result.original_filename,
    }
}

// ─── Delete an asset ─────────────────────────────────────────────────────────

export async function destroyAsset(
    publicId: string,
    resourceType: "image" | "video" | "raw" = "image",
): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

// ─── Build an optimized / transformed URL (no upload) ────────────────────────

export function buildUrl(
    publicId: string,
    transformations: Record<string, unknown> = {},
): string {
    return cloudinary.url(publicId, { secure: true, ...transformations })
}

export function thumbnailUrl(
    publicId: string,
    { width = 200, height = 200, crop = "fill" }: { width?: number; height?: number; crop?: string } = {},
): string {
    return cloudinary.url(publicId, { secure: true, width, height, crop })
}

// ─── Generate signed upload params (for large client-side uploads) ────────────

export function signUploadParams(
    params: Record<string, string | number>,
): { signature: string; timestamp: number } {
    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = { ...params, timestamp }
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!,
    )
    return { signature, timestamp }
}
