import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms of Service for YourApp.",
}

export default function TermsPage() {
    return (
        <div style={{ minHeight: "100vh", background: "var(--so-bg)", padding: "clamp(48px,6vw,96px) clamp(24px,5vw,80px)" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--so-ink-3)", textDecoration: "none", marginBottom: 40 }}>
                    ← Back to home
                </Link>

                <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--so-ink-4)", marginBottom: 16 }}>
                    Legal
                </p>
                <h1 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 450, letterSpacing: "-0.025em", color: "var(--so-ink)", margin: "0 0 8px" }}>
                    Terms of Service
                </h1>
                <p style={{ fontSize: 14, color: "var(--so-ink-4)", marginBottom: 48, fontFamily: "var(--font-geist-mono)" }}>
                    Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                {[
                    {
                        title: "1. Acceptance of Terms",
                        body: "By accessing or using YourApp, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.",
                    },
                    {
                        title: "2. Use of Service",
                        body: "You agree to use our service only for lawful purposes and in accordance with these Terms. You are responsible for all activity that occurs under your account.",
                    },
                    {
                        title: "3. Account Registration",
                        body: "You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.",
                    },
                    {
                        title: "4. Privacy",
                        body: "Your use of our service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.",
                    },
                    {
                        title: "5. Intellectual Property",
                        body: "The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.",
                    },
                    {
                        title: "6. Termination",
                        body: "We may terminate or suspend your account at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.",
                    },
                    {
                        title: "7. Limitation of Liability",
                        body: "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.",
                    },
                    {
                        title: "8. Changes to Terms",
                        body: "We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the new Terms.",
                    },
                    {
                        title: "9. Contact",
                        body: "If you have questions about these Terms, please contact us through our support channels.",
                    },
                ].map((section) => (
                    <div key={section.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: "1px solid var(--so-line)" }}>
                        <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--so-ink)", margin: "0 0 12px" }}>{section.title}</h2>
                        <p style={{ fontSize: 15, color: "var(--so-ink-2)", lineHeight: 1.7, margin: 0 }}>{section.body}</p>
                    </div>
                ))}

                <p style={{ fontSize: 13, color: "var(--so-ink-4)", marginTop: 40 }}>
                    Questions?{" "}
                    <Link href="/" style={{ color: "var(--so-accent)", textDecoration: "none" }}>
                        Contact us
                    </Link>
                </p>
            </div>
        </div>
    )
}
