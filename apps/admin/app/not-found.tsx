import Link from "next/link"
import { ShieldOff } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
                    <ShieldOff className="w-8 h-8 text-neutral-500" />
                </div>
                <p className="font-mono text-xs tracking-[0.2em] uppercase text-neutral-600 mb-4">404</p>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Page not found</h1>
                <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-900 font-semibold rounded-lg text-sm hover:bg-neutral-100 transition-colors"
                >
                    Back to sign in
                </Link>
            </div>
        </div>
    )
}
