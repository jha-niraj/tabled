import type { Metadata } from "next";
import "@repo/ui/styles/globals.css";
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
		default: "Tabled",
		template: "%s | Tabled"
	},
	description: "The table host who already knows you. Scan, talk, eat with no regrets.",
	keywords: ["restaurant", "menu", "AI host", "dining", "food recommendations", "QR menu", "Thai food", "voice ordering"],
	authors: [{ name: "Niraj Jha" }],
	creator: "Tabled",
	publisher: "Tabled",
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5000"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "/",
		siteName: "Tabled",
		title: "Tabled - The table host who already knows you",
		description: "The table host who already knows you. Scan, talk, eat with no regrets.",
		images: [
			{
				url: "/mainlogo.jpeg",
				width: 1024,
				height: 1024,
				alt: "Tabled",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Tabled - The table host who already knows you",
		description: "The table host who already knows you. Scan, talk, eat with no regrets.",
		images: ["/mainlogo.jpeg"],
		creator: "@thecoderz",
	},
	icons: {
		icon: [
			{ url: "/mainlogo.ico", sizes: "any" },
			{ url: "/mainlogo.jpeg", type: "image/jpeg", sizes: "512x512" },
		],
		apple: [
			{ url: "/mainlogo.jpeg", sizes: "180x180", type: "image/jpeg" },
		],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		// Add your verification codes here when you have them
		// google: "your-google-verification-code",
		// yandex: "your-yandex-verification-code",
	},
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