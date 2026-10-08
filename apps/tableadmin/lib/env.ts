const REQUIRED: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
}

if (typeof window === "undefined") {
    const missing = Object.entries(REQUIRED)
        .filter(([, v]) => !v)
        .map(([k]) => k)

    if (missing.length > 0) {
        throw new Error(
            `\n\n🚨  Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nCheck your apps/admin/.env file.\n`,
        )
    }
}

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
}
