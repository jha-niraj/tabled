import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "YourApp"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    padding: "80px 96px",
                    background: "#111211",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Subtle grid */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                    }}
                />

                {/* Soft glow — neutral instead of green */}
                <div
                    style={{
                        position: "absolute",
                        top: -120,
                        right: -120,
                        width: 480,
                        height: 480,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
                    }}
                />

                {/* Logo mark — white/neutral */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 48,
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "#111211",
                            }}
                        />
                    </div>
                    <span
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#ECEAE2",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        YourApp
                    </span>
                </div>

                {/* Headline */}
                <h1
                    style={{
                        fontSize: 80,
                        fontWeight: 500,
                        color: "#ECEAE2",
                        margin: "0 0 20px",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                        maxWidth: 800,
                        position: "relative",
                    }}
                >
                    {/* Replace with your app's headline */}
                    Build your product,
                    <br />
                    <span style={{ color: "#FFFFFF" }}>not your stack.</span>
                </h1>

                {/* Tagline */}
                <p
                    style={{
                        fontSize: 24,
                        color: "#9B9E97",
                        margin: 0,
                        maxWidth: 600,
                        lineHeight: 1.4,
                        position: "relative",
                    }}
                >
                    {/* Replace with your app's tagline */}
                    Production-ready from day one.
                </p>

                {/* Bottom accent line — white/neutral */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: "linear-gradient(90deg, rgba(255,255,255,0.3), transparent)",
                    }}
                />
            </div>
        ),
        { ...size },
    )
}
