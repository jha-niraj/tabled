import { notFound } from "next/navigation"
import { getRestaurant } from "@/lib/menu/knowledge"
import { QrCard } from "@/components/menu/qr-card"

type Props = { params: Promise<{ slug: string }> }

export default async function QrPage({ params }: Props) {
    const { slug } = await params
    const restaurant = getRestaurant(slug)
    if (!restaurant) notFound()
    return <QrCard name={restaurant.name} tagline={restaurant.tagline} slug={slug} />
}
