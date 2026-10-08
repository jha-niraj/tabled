"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Something went wrong
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 max-w-xs">
                An unexpected error occurred. Try refreshing the page.
            </p>
            {error.digest && (
                <p className="text-[11px] font-mono text-neutral-400 mb-6">ID: {error.digest}</p>
            )}
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                </button>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    )
}
