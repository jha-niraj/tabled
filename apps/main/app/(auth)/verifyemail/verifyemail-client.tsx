"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { DotmSquare11 } from "@repo/ui/components/ui/dotm-square-11"
import { InlineLoader } from "@repo/ui/components/ui/loader"
import {
    InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator,
} from "@repo/ui/components/ui/input-otp"
import { authClient } from "@repo/auth/client"
import { toast } from "@repo/ui/components/ui/sonner"
import { sendWelcomeEmail } from "@/actions/profile.action"

const Logomark = ({ size = 26 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
        <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        <circle cx="28" cy="16" r="2" fill="currentColor" opacity="0.6" />
    </svg>
)

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const email = searchParams.get("email") ?? ""
    const callbackUrl = searchParams.get("callbackUrl") ?? "/home"

    const [otp, setOtp] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleVerify() {
        if (otp.length < 6) { setError("Please enter the full 6-digit code."); return }
        setVerifying(true); setError(null)
        try {
            const result = await authClient.emailOtp.verifyEmail({
                email,
                otp,
                fetchOptions: { throw: false },
            })
            if (result?.error) {
                const msg = result.error.message?.toLowerCase() ?? ""
                if (msg.includes("expired")) setError("This code has expired. Please request a new one.")
                else if (msg.includes("invalid")) setError("Incorrect code. Please check and try again.")
                else setError(result.error.message ?? "Verification failed. Please try again.")
            } else {
                await sendWelcomeEmail()
                setDone(true)
                setTimeout(() => router.push(callbackUrl), 1200)
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setVerifying(false)
        }
    }

    async function handleResend() {
        if (!email) { toast.error("No email found"); return }
        setResending(true); setOtp(""); setError(null)
        try {
            await authClient.emailOtp.sendVerificationOtp({
                email,
                type: "email-verification",
                fetchOptions: { throw: false },
            })
            toast.success("New code sent!", { description: `Check ${email} for your new verification code.` })
        } catch {
            toast.error("Failed to resend. Please try again.")
        } finally {
            setResending(false)
        }
    }

    const MAX_W = 1280

    if (done) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--so-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div style={{ maxWidth: MAX_W, width: "100%", display: "flex", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", maxWidth: 400 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--so-accent-soft)", color: "var(--so-accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                            <CheckCircle size={28} />
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.022em", color: "var(--so-ink)", margin: "0 0 8px" }}>Email verified!</h1>
                        <p style={{ fontSize: 14, color: "var(--so-ink-3)", margin: 0 }}>Redirecting you now...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--so-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ maxWidth: MAX_W, width: "100%", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: 420 }}>
                    {/* Logo */}
                    <div style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}>
                        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--so-ink)", textDecoration: "none", fontSize: 16, fontWeight: 500 }}>
                            <Logomark size={24} /><span>YourApp</span>
                        </Link>
                    </div>

                    {/* Card */}
                    <div style={{ padding: "32px 32px", background: "var(--so-surface)", border: "1px solid var(--so-line)", borderRadius: 20, textAlign: "center" }}>
                        {/* Icon */}
                        <div style={{ width: 52, height: 52, borderRadius: 999, background: "var(--so-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 22 }}>
                            ✉️
                        </div>

                        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.022em", color: "var(--so-ink)", margin: "0 0 8px" }}>
                            Check your inbox
                        </h1>
                        <p style={{ fontSize: 14, color: "var(--so-ink-3)", margin: "0 0 6px", lineHeight: 1.5 }}>
                            We sent a 6-digit verification code to
                        </p>
                        {email && (
                            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--so-ink)", margin: "0 0 28px", fontFamily: "var(--font-geist-mono)" }}>
                                {email}
                            </p>
                        )}

                        {/* OTP input */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(v) => { setOtp(v); setError(null) }}
                                disabled={verifying}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>

                        {/* Error */}
                        {error && (
                            <p style={{ fontSize: 13, color: "#dc2626", margin: "8px 0 16px", textAlign: "center" }}>
                                {error}
                            </p>
                        )}

                        {/* Verify button */}
                        <button
                            onClick={handleVerify}
                            disabled={verifying || otp.length < 6}
                            style={{ width: "100%", height: 50, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: otp.length < 6 ? "var(--so-ink-5)" : "var(--so-ink)", color: "var(--so-bg)", borderRadius: 999, border: "none", fontFamily: "inherit", fontSize: 15, fontWeight: 500, cursor: otp.length < 6 ? "not-allowed" : "pointer", marginTop: error ? 0 : 16, transition: "background 0.2s" }}
                        >
                            {verifying ? <DotmSquare11 size={16} dotSize={2} speed={1.5} /> : "Verify email"}
                        </button>

                        {/* Resend */}
                        <div style={{ marginTop: 20, padding: "16px", background: "var(--so-bg)", border: "1px solid var(--so-line)", borderRadius: 12, fontSize: 13, color: "var(--so-ink-3)", lineHeight: 1.5, textAlign: "left" }}>
                            <strong style={{ display: "block", color: "var(--so-ink)", marginBottom: 4, fontSize: 13 }}>Didn&apos;t get it?</strong>
                            Check your spam folder, or{" "}
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                style={{ color: "var(--so-ink)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit", fontWeight: 600, textDecoration: "underline" }}
                            >
                                {resending ? "Sending..." : "resend the code"}
                            </button>.
                            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--so-ink-4)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.04em" }}>
                                Code expires in 10 minutes.
                            </p>
                        </div>
                    </div>

                    {/* Back link */}
                    <div style={{ marginTop: 24, textAlign: "center" }}>
                        <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--so-ink-3)", textDecoration: "none" }}>
                            <ArrowLeft size={13} />
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailClient() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--so-bg)" }}>
                <InlineLoader size={24} />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
