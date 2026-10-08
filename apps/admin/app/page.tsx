"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { PageLoader } from "@repo/ui/components/ui/loader"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { motion } from "framer-motion"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle
} from "@repo/ui/components/ui/sheet"
import { Badge } from "@repo/ui/components/ui/badge"

// Replace with your product's background video
const BG_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

/** Validate that a callbackUrl is a safe same-origin relative path. */
function resolveRedirect(raw: string | null): string {
    if (!raw) return "/home"
    if (!raw.startsWith("/") || raw.startsWith("//")) return "/home"
    if (raw.includes(":")) return "/home"
    return raw
}

function AdminLandingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = resolveRedirect(searchParams.get("callbackUrl"))

    const { data: session, isPending } = useSession()
    const [sheetOpen, setSheetOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Already logged in — go directly to callbackUrl or /home
    useEffect(() => {
        if (!isPending && session) {
            setRedirecting(true)
            router.push(callbackUrl)
        }
    }, [session, isPending, router, callbackUrl])

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error("Missing credentials", { description: "Please enter your email and password" })
            return
        }
        setIsLoading(true)
        try {
            const result = await signIn.email({
                email,
                password,
                fetchOptions: { throw: false },
            })
            if (result?.error) {
                toast.error("Sign in failed", { description: "Invalid email or password" })
            } else {
                setRedirecting(true)
                toast.success("Welcome back!", { description: "Redirecting..." })
                router.push(callbackUrl)
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "An unexpected error occurred"
            toast.error("Sign in failed", { description: msg })
        } finally {
            setIsLoading(false)
        }
    }

    if (isPending || redirecting) return <PageLoader />

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950">
            {/* Background video - replace BG_VIDEO with your own */}
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src={BG_VIDEO} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/65" />

            {/* Hero */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="max-w-2xl w-full"
                >
                    <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/15 text-sm px-4 py-1.5 font-medium tracking-wide">
                        {/* Replace with your product name */}
                        Tabled Platform
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-5">
                        {/* Replace with your headline */}
                        Your platform,<br />under control.
                    </h1>
                    <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg mx-auto">
                        {/* Replace with your description */}
                        Monitor users, manage your team, and configure settings - all in one place.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSheetOpen(true)}
                        className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 transition-colors text-base shadow-2xl"
                    >
                        Sign in to admin
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </motion.div>
            </div>

            <div className="absolute bottom-6 left-6 z-10">
                <p className="text-white/40 text-xs font-mono tracking-wider">
                    {/* Replace with your company/product name */}
                    Built with Shunya Tech Base
                </p>
            </div>

            {/* Sign-in sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="right"
                    className="sm:max-w-md w-full p-0 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 overflow-y-auto"
                >
                    <div className="p-8 h-full flex flex-col">
                        <SheetHeader className="mb-8">
                            <SheetTitle className="text-2xl font-bold text-neutral-900 dark:text-white text-left">
                                Welcome back
                            </SheetTitle>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-left mt-1">
                                Sign in to access the admin control panel
                            </p>
                        </SheetHeader>

                        <form onSubmit={handleSignIn} className="space-y-5 flex-1">
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="cursor-pointer w-full py-3 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <><DotmSquare11 size={16} dotSize={2} speed={1.5} /> Signing in...</>
                                ) : "Sign In"}
                            </button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

// Wrap in Suspense — required by Next.js when useSearchParams is used
export default function AdminLandingPage() {
    return (
        <Suspense fallback={<PageLoader />}>
            <AdminLandingContent />
        </Suspense>
    )
}
