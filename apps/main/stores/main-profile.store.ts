"use client"

import { create } from "zustand"

interface MainProfileStore {
    avatarUrl: string | null
    setAvatarUrl: (url: string | null) => void
}

export const useMainProfileStore = create<MainProfileStore>((set) => ({
    avatarUrl: null,
    setAvatarUrl: (url) => set({ avatarUrl: url }),
}))
