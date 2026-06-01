import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getR2Client() {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env')
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
    })
}

/**
 * Generate a presigned URL for uploading a file to R2.
 * Use this in a server action - return the URL to the client, then the client
 * uploads directly to R2 with a PUT request.
 */
export async function getUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
): Promise<string> {
    const client = getR2Client()
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    })
    return getSignedUrl(client, command, { expiresIn })
}

/**
 * Generate a presigned URL for downloading / reading a private file.
 * Skip this if your R2 bucket is public - just use getPublicUrl() instead.
 */
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = getR2Client()
    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
    })
    return getSignedUrl(client, command, { expiresIn })
}

/**
 * Delete a file from R2. Call from a server action after confirming ownership.
 */
export async function deleteFile(key: string): Promise<void> {
    const client = getR2Client()
    await client.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
    }))
}

/**
 * Get the public URL for a file. Only works if your R2 bucket has a public
 * custom domain configured (set R2_PUBLIC_URL in .env).
 */
export function getPublicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_URL
    if (!base) throw new Error('R2_PUBLIC_URL is not set')
    return `${base.replace(/\/$/, '')}/${key}`
}

/**
 * Generate a unique storage key for a file.
 * Pattern: {prefix}/{userId}/{timestamp}-{random}.{ext}
 */
export function generateKey(prefix: string, userId: string, filename: string): string {
    const ext = filename.split('.').pop() ?? 'bin'
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 8)
    return `${prefix}/${userId}/${ts}-${rand}.${ext}`
}
