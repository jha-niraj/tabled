// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const

// ─── File uploads ─────────────────────────────────────────────────────────────
export const UPLOAD = {
    AVATAR_MAX_MB: 5,
    AVATAR_MAX_BYTES: 5 * 1024 * 1024,
    FILE_MAX_MB: 100,
    FILE_MAX_BYTES: 100 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/mov"],
} as const

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const AUTH = {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_DURATION_DAYS: 30,
} as const

// ─── UI ───────────────────────────────────────────────────────────────────────
export const UI = {
    TOAST_DURATION_MS: 4000,
    DEBOUNCE_MS: 300,
    ANIMATION_DURATION_MS: 200,
} as const

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATIONS = {
    MAX_UNREAD_BADGE: 99,
    FETCH_LIMIT: 20,
} as const
