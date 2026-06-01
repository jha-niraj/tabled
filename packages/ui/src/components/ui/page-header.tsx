import type React from "react"
import Link from "next/link"

interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps {
    title: string
    description?: string
    breadcrumb?: BreadcrumbItem[]
    action?: React.ReactNode
    badge?: string
    icon?: React.ReactNode
}

export function PageHeader({ title, description, breadcrumb, action, badge, icon }: PageHeaderProps) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 32,
            }}
        >
            {breadcrumb && breadcrumb.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                    }}
                >
                    {breadcrumb.map((crumb, i) => (
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {i > 0 && (
                                <span style={{ fontSize: 12, color: "var(--so-ink-5, #C5C8C0)" }}>
                                    /
                                </span>
                            )}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    style={{
                                        fontSize: 12,
                                        fontFamily: "var(--font-geist-mono)",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color: "var(--so-ink-4, #9B9E97)",
                                        textDecoration: "none",
                                    }}
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontFamily: "var(--font-geist-mono)",
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        color: "var(--so-ink-4, #9B9E97)",
                                    }}
                                >
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    {icon && (
                        <span style={{ flexShrink: 0, color: "var(--so-ink-3, #6B6E67)" }}>
                            {icon}
                        </span>
                    )}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <h1
                                style={{
                                    fontSize: "clamp(22px,2.6vw,30px)",
                                    fontWeight: 500,
                                    letterSpacing: "-0.022em",
                                    color: "var(--so-ink, #111211)",
                                    margin: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                {title}
                            </h1>
                            {badge && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontFamily: "var(--font-geist-mono)",
                                        letterSpacing: "0.06em",
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "var(--so-accent-soft, #EEF2EB)",
                                        color: "var(--so-accent, #6A7E5F)",
                                        fontWeight: 500,
                                    }}
                                >
                                    {badge}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p
                                style={{
                                    fontSize: 14,
                                    color: "var(--so-ink-3, #6B6E67)",
                                    margin: "4px 0 0",
                                    lineHeight: 1.5,
                                }}
                            >
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action && <div style={{ flexShrink: 0 }}>{action}</div>}
            </div>
        </div>
    )
}
