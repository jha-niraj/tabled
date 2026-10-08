"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@repo/ui/components/ui/carousel"
import { cn } from "@repo/ui/lib/utils"
import type { MediaImage, MediaVideo } from "@/lib/menu/types"
import { SmartImage } from "./smart-image"

type Props = {
    images: MediaImage[]
    video?: MediaVideo
    aspect?: string
    className?: string
}

export function MediaCarousel({ images, video, aspect = "4 / 3", className }: Props) {
    const [api, setApi] = useState<CarouselApi>()
    const [index, setIndex] = useState(0)
    const total = images.length + (video ? 1 : 0)

    useEffect(() => {
        if (!api) return
        const onSelect = () => setIndex(api.selectedScrollSnap())
        onSelect()
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    if (total === 0) return null

    return (
        <div className={cn("relative", className)}>
            <Carousel setApi={setApi} opts={{ loop: total > 1 }} className="rounded-[var(--tt-radius)] overflow-hidden">
                <CarouselContent className="ml-0">
                    {images.map((img, i) => (
                        <CarouselItem key={img.src} className="pl-0">
                            <SmartImage src={img.src} alt={img.alt} priority={i === 0} className="w-full" style={{ aspectRatio: aspect }} />
                        </CarouselItem>
                    ))}
                    {video && (
                        <CarouselItem key="video" className="pl-0">
                            <VideoSlide video={video} aspect={aspect} active={index === images.length} />
                        </CarouselItem>
                    )}
                </CarouselContent>
            </Carousel>

            {total > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
                    {Array.from({ length: total }).map((_, i) => (
                        <span
                            key={i}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                                width: i === index ? 18 : 6,
                                background: i === index ? "#fff" : "rgba(255,255,255,0.55)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                            }}
                        />
                    ))}
                </div>
            )}

            {video && index !== images.length && (
                <button
                    type="button"
                    onClick={() => api?.scrollTo(images.length)}
                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
                    style={{ background: "rgba(20,14,10,0.55)", backdropFilter: "blur(8px)" }}
                >
                    <Play size={12} fill="currentColor" /> Watch
                </button>
            )}

            {images[index] && images[index].credit && (
                <span
                    className="absolute bottom-3 right-3 text-[10px] text-white/80 pointer-events-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                    {images[index].credit}
                </span>
            )}
        </div>
    )
}

function VideoSlide({ video, aspect, active }: { video: MediaVideo; aspect: string; active: boolean }) {
    return (
        <div className="relative w-full" style={{ aspectRatio: aspect, background: "#000" }}>
            <video
                className="w-full h-full object-cover"
                controls
                playsInline
                preload={active ? "metadata" : "none"}
                poster={video.poster}
            >
                {video.sources.map((s) => (
                    <source key={s.src} src={s.src} type={s.type} />
                ))}
            </video>
            {video.caption && (
                <span
                    className="absolute top-3 left-3 right-16 text-xs text-white/90 pointer-events-none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
                >
                    {video.caption}
                </span>
            )}
        </div>
    )
}
