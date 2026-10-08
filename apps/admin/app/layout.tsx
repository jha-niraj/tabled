import type { Metadata } from "next";
import "@repo/ui/styles/globals.css";
import "./editor.css";
import "@/lib/env";
import { ThemeProvider } from "@repo/ui/components/themeprovider";
import { Geist, Space_Grotesk, Geist_Mono } from "next/font/google";
import { Toaster as SonnerToaster } from "@repo/ui/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});
const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
	display: 'swap',
	variable: '--font-space-grotesk',
})
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Tabled Platform",
		template: "%s | Tabled Platform"
	},
	description: "Tabled Platform - internal admin for the Tabled team: restaurants, owners, and system settings.",
	robots: { index: false, follow: false },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`
				${spaceGrotesk.className} ${geistSans.variable} ${geistMono.variable} antialiased 
			`}>
				<Providers>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
							{children}
						<SonnerToaster position="top-center" closeButton richColors />
					</ThemeProvider>
				</Providers>
			</body>
		</html>
	);
}