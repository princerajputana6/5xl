"use client";

import * as React from "react";
import { ArrowRight, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import type { ProductCardDTO } from "@/types/catalog";

/** Round "+" quick-add used on the spotlight's product stack cards. */
export function SpotlightAddButton({ product }: { product: ProductCardDTO }) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      disabled={!product.inStock}
      aria-label={`Add ${product.name} to cart`}
      onClick={() => {
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          variantId: null,
          variantLabel: null,
          price: product.price,
          mrp: product.mrp,
        });
        toast.success(`${product.name} added to cart`);
      }}
      className="grid size-7 shrink-0 place-items-center rounded-full bg-[#2f8fdc] text-white shadow-md shadow-[#2f8fdc]/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 md:size-10"
    >
      <Plus className="size-4 md:size-5" />
    </button>
  );
}

/**
 * Dark video card: muted looping preview; the play button / "Watch Now"
 * restarts it with sound and controls.
 */
export function SpotlightVideo({
  src,
  poster,
  eyebrow,
  title,
}: {
  src: string;
  poster?: string;
  eyebrow: string;
  title: string;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [watching, setWatching] = React.useState(false);

  function watch() {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.controls = true;
    void v.play();
    setWatching(true);
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl bg-[#101418] md:mt-10 md:rounded-3xl">
      <div className="relative aspect-[2.6/1] md:aspect-[3.4/1]">
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        {!watching && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-[#101418] via-[#101418]/75 to-black/10" />
            <button
              type="button"
              onClick={watch}
              aria-label="Play video"
              className="absolute right-[12%] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-white/90 bg-black/20 text-white backdrop-blur-sm transition-transform hover:scale-105 md:right-[18%] md:size-16"
            >
              <Play className="ml-0.5 size-5 fill-white md:size-7" />
            </button>
            <div className="absolute inset-y-0 left-0 flex w-[60%] flex-col justify-center gap-1.5 pl-5 text-white md:w-[45%] md:gap-3 md:pl-12">
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-[#5fb3f0] md:text-xs">
                {eyebrow}
              </p>
              <p className="text-lg font-extrabold leading-[1.05] tracking-tight md:text-4xl">
                {title}
              </p>
              <button
                type="button"
                onClick={watch}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/70 px-3 py-1 text-[0.65rem] font-semibold transition-colors hover:bg-white hover:text-[#101418] md:px-5 md:py-2 md:text-sm"
              >
                Watch Now <ArrowRight className="size-3 md:size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
