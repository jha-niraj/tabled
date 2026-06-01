import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const now = new Date()

    return [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${siteUrl}/signin`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${siteUrl}/signup`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]
}
