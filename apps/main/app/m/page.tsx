import { redirect } from "next/navigation"
import { listRestaurantSlugs } from "@/lib/menu/knowledge"

export default function MenuIndex() {
    const first = listRestaurantSlugs()[0] ?? "tuk-tuk-thai"
    redirect(`/m/${first}`)
}
