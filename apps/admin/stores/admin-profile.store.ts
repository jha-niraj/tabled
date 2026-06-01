"use client"

import { create } from "zustand"

interface AdminProfileStore {
    /**
     * The currently displayed avatar URL.
     * null = not yet set from the server; falls back to session.user.image in components.
     * After an upload the page writes the new URL here so the sidebar
     * updates immediately without a hard refresh.
     */
    avatarUrl: string | null
    setAvatarUrl: (url: string | null) => void
}

export const useAdminProfileStore = create<AdminProfileStore>((set) => ({
    avatarUrl: null,
    setAvatarUrl: (url) => set({ avatarUrl: url }),
}))
