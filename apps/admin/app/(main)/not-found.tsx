import Link from "next/link"
import { ShieldOff } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-4">
                <ShieldOff className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-3">404</p>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Page not found
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs">
                This page doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link
                href="/home"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
                Back to home
            </Link>
        </div>
    )
}
