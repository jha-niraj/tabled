"use server"

import { v2 as cloudinary } from "cloudinary"
import { auth } from "@repo/auth"
import { headers } from "next/headers"

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

/**
 * Returns signed upload params so the client can upload directly to Cloudinary
 * without needing an unsigned upload preset.
 * The API secret never leaves the server.
 */
export async function getSignedUploadParams(folder = "admin-avatars"): Promise<{
    signature: string
    timestamp: number
    apiKey: string
    cloudName: string
    folder: string
}> {
    const s = await auth.api.getSession({ headers: await headers() })
    if (!s?.user?.id) throw new Error("Not authenticated")

    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = { timestamp, folder }
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET!,
    )

    return {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
        folder,
    }
}
