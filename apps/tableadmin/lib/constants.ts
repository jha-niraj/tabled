// ─── Pagination ───────────────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
} as const

// ─── Admin ────────────────────────────────────────────────────────────────────
export const ADMIN = {
    INVITATION_EXPIRY_DAYS: 7,
    AUDIT_LOG_RETENTION_DAYS: 90,
} as const

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATIONS = {
    MAX_UNREAD_BADGE: 99,
    FETCH_LIMIT: 10,
} as const

// ─── UI ───────────────────────────────────────────────────────────────────────
export const UI = {
    DEBOUNCE_MS: 300,
    TOAST_DURATION_MS: 4000,
} as const
