import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRestaurant, listRestaurantSlugs } from "@/lib/menu/knowledge"
import { Concierge } from "@/components/menu/concierge"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
    return listRestaurantSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const r = getRestaurant(slug)
    if (!r) return { title: "Menu" }
    return {
        title: { absolute: `${r.name} - Your table host` },
        description: r.shortDescription,
        openGraph: { title: r.name, description: r.shortDescription, images: r.media.hero[0] ? [r.media.hero[0].src] : [] },
    }
}

export default async function MenuPage({ params }: Props) {
    const { slug } = await params
    const restaurant = getRestaurant(slug)
    if (!restaurant) notFound()
    return <Concierge restaurant={restaurant} />
}
