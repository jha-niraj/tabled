import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "YourApp",
        short_name: "YourApp",
        description: "Your app description here.",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#F6F4EE",
        theme_color: "#111211",
        categories: ["productivity"],
        icons: [
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
        screenshots: [],
    }
}
