"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { signIn } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { getInvitationByToken, joinAdminInvitation } from "@/actions/admin.action"
import Link from "next/link"

function JoinContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token") ?? ""

    type State = "loading" | "valid" | "invalid" | "success"
    const [state, setState] = useState<State>("loading")
    const [inviteData, setInviteData] = useState<{ email: string; adminRole: string; name: string | null } | null>(null)
    const [errorMsg, setErrorMsg] = useState("")

    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!token) {
            setErrorMsg("No invitation token found in the URL.")
            setState("invalid")
            return
        }
        getInvitationByToken(token).then((res) => {
            if (res.success && res.data) {
                setInviteData(res.data)
                setState("valid")
            } else {
                setErrorMsg(res.error ?? "Invalid or expired invitation")
                setState("invalid")
            }
        })
    }, [token])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }
        if (password !== confirm) { toast.error("Passwords don't match"); return }

        setSubmitting(true)
        try {
            const result = await joinAdminInvitation(token, password)
            if (!result.success) {
                toast.error(result.error ?? "Failed to accept invitation")
                setSubmitting(false)
                return
            }

            // Auto sign in
            const signInResult = await signIn.email({
                email: result.data!.email,
                password,
                callbackURL: "/home",
                fetchOptions: { throw: false },
            })

            if (signInResult?.error) {
                setState("success")
            } else {
                setState("success")
                setTimeout(() => router.push("/home"), 1500)
            }
        } catch {
            toast.error("Something went wrong. Please try again.")
            setSubmitting(false)
        }
    }

    const inputClass = "w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 text-sm transition-colors"

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-xl shadow-red-500/20">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Loading */}
                {state === "loading" && (
                    <div className="text-center">
                        <InlineLoader size={32} />
                        <p className="text-neutral-400 text-sm">Verifying your invitation...</p>
                    </div>
                )}

                {/* Invalid */}
                {state === "invalid" && (
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Invitation invalid</h1>
                        <p className="text-neutral-400 text-sm mb-6">{errorMsg}</p>
                        <Link href="/" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                            ← Back to sign in
                        </Link>
                    </div>
                )}

                {/* Valid - set password form */}
                {state === "valid" && inviteData && (
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                        <div className="p-6 border-b border-neutral-800">
                            <h1 className="text-xl font-bold text-white mb-1">Accept your invitation</h1>
                            <p className="text-neutral-400 text-sm">
                                You&apos;ve been invited as{" "}
                                <span className="text-red-400 font-medium">
                                    {inviteData.adminRole.replace("_", " ")}
                                </span>
                            </p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                                    Email address
                                </label>
                                <div className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm select-none">
                                    {inviteData.email}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                                        Set your password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPwd ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="At least 8 characters"
                                            required
                                            className={inputClass + " pr-10"}
                                        />
                                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                                        Confirm password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="Re-enter your password"
                                            required
                                            className={inputClass + " pr-10"}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="cursor-pointer w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {submitting ? (
                                        <><DotmSquare11 size={14} dotSize={2} speed={1.2} /> Setting up account...</>
                                    ) : (
                                        <>Create account & sign in <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Success */}
                {state === "success" && (
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re in!</h1>
                        <p className="text-neutral-400 text-sm mb-2">Account created. Signing you in...</p>
                        <InlineLoader size={20} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default function JoinClient() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <InlineLoader size={32} />
            </div>
        }>
            <JoinContent />
        </Suspense>
    )
}
