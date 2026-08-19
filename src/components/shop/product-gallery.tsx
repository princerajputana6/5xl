"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { WishlistButton } from "./wishlist-button";
import { ShareButton } from "./share-button";

/** Product pages show at most this many photos. */
export const MAX_GALLERY_IMAGES = 10;

export function ProductGallery({
  images,
  name,
  productId,
  initialInWishlist = false,
}: {
  images: string[];
  name: string;
  productId?: string;
  initialInWishlist?: boolean;
}) {
  const list = React.useMemo(
    () => (images.length ? images.slice(0, MAX_GALLERY_IMAGES) : [""]),
    [images]
  );

  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const syncArrows = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  React.useEffect(syncArrows, [syncArrows, list.length]);

  function nudge(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  /** Keeps the selected thumbnail visible when the main image changes. */
  function select(i: number) {
    setActive(i);
    trackRef.current
      ?.querySelector<HTMLElement>(`[data-thumb="${i}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-28 lg:self-start">
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
        <ProductImage
          key={active}
          src={list[active]}
          alt={name}
          fallbackSeed={`${name}-${active}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-in fade-in zoom-in-95 object-cover duration-500 group-hover:scale-105 motion-safe:transition-transform"
        />

        {/* Wishlist + share, floated over the image like the reference layout */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          {productId && (
            <WishlistButton productId={productId} initialInWishlist={initialInWishlist} />
          )}
          <ShareButton title={name} />
        </div>

        {list.length > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur">
            {active + 1} / {list.length}
          </span>
        )}
      </div>

      {list.length > 1 && (
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={syncArrows}
            className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {list.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                data-thumb={i}
                onClick={() => select(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "relative aspect-square w-[19%] min-w-[4.5rem] shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-muted",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70",
                  i === active
                    ? "border-primary shadow-sm ring-2 ring-primary/25"
                    : "border-border opacity-70 hover:opacity-100"
                )}
              >
                <ProductImage
                  src={src}
                  alt={`${name} — view ${i + 1}`}
                  fallbackSeed={`${name}-${i}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <SliderArrow side="left" hidden={atStart} onClick={() => nudge(-1)} />
          <SliderArrow side="right" hidden={atEnd} onClick={() => nudge(1)} />
        </div>
      )}
    </div>
  );
}

function SliderArrow({
  side,
  hidden,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous images" : "Next images"}
      tabIndex={hidden ? -1 : 0}
      className={cn(
        "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full",
        "border border-border bg-background/90 shadow-sm backdrop-blur",
        "transition-all duration-200 hover:scale-110 hover:border-primary hover:text-primary active:scale-95",
        side === "left" ? "-left-3" : "-right-3",
        hidden && "pointer-events-none opacity-0"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
