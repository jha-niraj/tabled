import type React from "react"

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={className}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(48px,6vw,80px) 24px",
                textAlign: "center",
                gap: 0,
            }}
        >
            {icon && (
                <div
                    style={{
                        marginBottom: 16,
                        opacity: 0.35,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {icon}
                </div>
            )}
            <p
                style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--so-ink, #111211)",
                    margin: "0 0 6px",
                }}
            >
                {title}
            </p>
            {description && (
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--so-ink-3, #6B6E67)",
                        margin: "0 0 24px",
                        maxWidth: "36ch",
                        lineHeight: 1.5,
                    }}
                >
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    )
}
