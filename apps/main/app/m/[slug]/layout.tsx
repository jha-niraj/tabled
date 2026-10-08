import { Fraunces } from "next/font/google"
import "./menu.css"

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    axes: ["opsz", "SOFT"],
    display: "swap",
})

export default function MenuLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`tt tt-root ${fraunces.variable} min-h-dvh`}>
            {/* Sheets render in a portal outside this wrapper, so the font variable must also live on :root */}
            <style>{`:root { --font-fraunces: ${fraunces.style.fontFamily}; }`}</style>
            {children}
        </div>
    )
}
