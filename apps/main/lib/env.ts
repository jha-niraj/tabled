/**
 * Environment variable validation - runs at module load time.
 * Import this in the root layout (server component) so it runs on every
 * cold start and gives a clear error message before anything else fails.
 *
 * Only validates variables that are ALWAYS required.
 * Optional variables (Google OAuth, Resend, Cloudinary, R2) are handled
 * gracefully by the features that use them.
 */

const REQUIRED: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
}

if (typeof window === "undefined") {
    // Server-only check - don't run in browser
    const missing = Object.entries(REQUIRED)
        .filter(([, v]) => !v)
        .map(([k]) => k)

    if (missing.length > 0) {
        throw new Error(
            `\n\n🚨  Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCheck your apps/main/.env file.\n`,
        )
    }
}

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
}
