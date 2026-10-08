export type MediaImage = { src: string; alt: string; credit?: string }
export type MediaVideo = {
    poster: string
    sources: { src: string; type: string }[]
    caption?: string
    credit?: string
}

export type MenuSection = {
    id: string
    name: string
    thai: string
    order: number
    blurb: string
    vibe: string[]
}

export type TasteProfile = { sweet: number; sour: number; salty: number; rich: number; fresh: number }

export type Dish = {
    id: string
    sectionId: string
    name: string
    thaiName: string
    pronunciation: string
    tagline: string
    description: string
    story: string
    price: number
    portion: string
    serves: string
    spice: 0 | 1 | 2 | 3 | 4
    spiceAdjustable: boolean
    profile: TasteProfile
    tastesLike: string
    texture: string
    keyIngredients: string[]
    allergens: string[]
    dietary: string[]
    howToEat: string[]
    pairsWith: string[]
    rating: { avg: number; count: number }
    reviews: { quote: string; by: string; when: string }[]
    tags: string[]
    prepMinutes: number
    bestFor: string[]
    media: { images: MediaImage[]; video?: MediaVideo }
}

export type Restaurant = {
    slug: string
    name: string
    tagline: string
    shortDescription: string
    story: string
    cuisine: string[]
    address: string
    neighbourhood: string
    phone: string
    hours: { weekdays: string; weekends: string }
    priceRange: string
    ratings: {
        overall: number
        totalReviews: number
        platforms: { name: string; rating: number; count: number }[]
        breakdown: { food: number; service: number; ambience: number; value: number }
    }
    awards: string[]
    ambience: string[]
    chefNote: string
    spiceGuide: { level: number; label: string; note: string }[]
    dietaryLegend: Record<string, string>
    mostLoved: string[]
    welcome: {
        greeting: string
        intro: string
        firstQuestion: { question: string; options: string[] }
    }
    media: { hero: MediaImage[]; video?: MediaVideo }
    sections: MenuSection[]
    dishes: Dish[]
}

export type AskPrompt = { question: string; options: string[] }

export type HostReply = {
    say: string
    show: string[]
    ask: AskPrompt | null
    remember: string[]
}

export type ChatTurn = { role: "user" | "assistant"; content: string }

export type ChatResponse = {
    reply: HostReply
    dishes: Dish[]
    raw: string
}
