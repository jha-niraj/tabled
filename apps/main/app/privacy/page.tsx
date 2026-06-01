import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for YourApp.",
}

export default function PrivacyPage() {
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
                    Privacy Policy
                </h1>
                <p style={{ fontSize: 14, color: "var(--so-ink-4)", marginBottom: 48, fontFamily: "var(--font-geist-mono)" }}>
                    Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>

                {[
                    {
                        title: "1. Information We Collect",
                        body: "We collect information you provide when you create an account (name, email address), and information generated through your use of our service (usage data, activity logs).",
                    },
                    {
                        title: "2. How We Use Your Information",
                        body: "We use your information to operate and improve our service, send transactional emails (account creation, password reset), and communicate important service updates.",
                    },
                    {
                        title: "3. Data Storage",
                        body: "Your data is stored securely in our database. We use industry-standard security measures to protect against unauthorised access, alteration, disclosure, or destruction of your data.",
                    },
                    {
                        title: "4. Cookies",
                        body: "We use session cookies to authenticate users and maintain sessions. These are necessary for the service to function and cannot be opted out of while using the service.",
                    },
                    {
                        title: "5. Third-Party Services",
                        body: "We use third-party services including authentication providers (Google OAuth) and cloud infrastructure. These providers have their own privacy policies governing the use of your information.",
                    },
                    {
                        title: "6. Data Sharing",
                        body: "We do not sell, trade, or rent your personal information to third parties. We may share aggregated, anonymised data that does not identify any individual.",
                    },
                    {
                        title: "7. Your Rights",
                        body: "You have the right to access, update, or delete your personal data at any time. You can manage this from your account settings. To delete your account and all associated data, visit your profile settings.",
                    },
                    {
                        title: "8. Data Retention",
                        body: "We retain your personal data for as long as your account is active. When you delete your account, your personal data is removed from our systems within 30 days.",
                    },
                    {
                        title: "9. Children",
                        body: "Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.",
                    },
                    {
                        title: "10. Changes to this Policy",
                        body: "We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our service.",
                    },
                    {
                        title: "11. Contact",
                        body: "If you have questions or concerns about this Privacy Policy or your personal data, please contact us through our support channels.",
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
