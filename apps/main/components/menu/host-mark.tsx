export function HostMark({ size = 28 }: { size?: number }) {
    return (
        <span
            className="tt-display-sm inline-flex items-center justify-center rounded-full shrink-0 select-none"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.5,
                background: "linear-gradient(135deg, var(--tt-saffron), var(--tt-gold))",
                color: "#fff",
                boxShadow: "var(--tt-shadow-sm)",
            }}
            aria-hidden
        >
            N
        </span>
    )
}
