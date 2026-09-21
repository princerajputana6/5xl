"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types/catalog";

export type VideoSlide = {
  url: string;
  poster: string;
  caption: string;
  product: ProductCardDTO | null;
};

function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Horizontal video slider for the homepage. Each slide plays a short clip
 * (self-hosted mp4/webm or a YouTube link) and can surface an assigned product
 * beneath it. Scrolls via snap + arrow buttons; keyboard and touch friendly.
 */
export function VideoSlider({ slides }: { slides: VideoSlide[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  function scrollByCard(dir: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-slide]");
    const amount = card ? card.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {slides.map((s, i) => {
          const yt = youTubeId(s.url);
          return (
            <div
              key={i}
              data-slide
              className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
            >
              <div className="relative aspect-[9/13] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-black/5">
                {yt ? (
                  <iframe
                    className="absolute inset-0 size-full"
                    src={`https://www.youtube.com/embed/${yt}`}
                    title={s.caption || `Video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : s.url ? (
                  <video
                    className="absolute inset-0 size-full object-cover"
                    src={s.url}
                    poster={s.poster || undefined}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-sm text-white/50">
                    No video
                  </div>
                )}
                {s.caption && !yt && (
                  <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-medium text-white">
                    {s.caption}
                  </p>
                )}
              </div>

              {s.product && (
                <Link
                  href={`/products/${s.product.slug}`}
                  className="group mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/60"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ProductImage
                      src={s.product.image}
                      alt={s.product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold">{s.product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatINR(s.product.price)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCard(-1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCard(1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
