import { Fraunces } from "next/font/google"
import "./menu.css"

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    axes: ["opsz", "SOFT"],
    display: "swap",
})

export default function MenuLayout({ children }: { children: React.ReactNode }) {
    return <div className={`tt ${fraunces.variable} min-h-dvh`}>{children}</div>
}
