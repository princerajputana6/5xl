import Link from "next/link";
import { Gift } from "lucide-react";
import type { PublicCategory } from "@/server/services/category.service";
import { cn } from "@/lib/utils";

/**
 * "What's your move?" category rail (RIPPED UP / RUN-inspired): a horizontal
 * row of soft cream tiles with the category image floating inside, the name +
 * tagline sitting below each tile, and a red "Build Your Bundle" promo card
 * leading the row. Scrolls horizontally on overflow.
 */
export function CategoryGrid({ categories }: { categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  // Card width is sized so ~4.5 tiles peek into view on mobile (a clear
  // "scroll for more" affordance), stepping up to comfortable fixed sizes on
  // wider screens. Gap is kept tight so the 4.5-up count stays accurate.
  const itemWidth =
    "w-[calc((100%-2.5rem)/4.5)] min-w-16 shrink-0 snap-start sm:w-28 md:w-32 lg:w-36";

  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-3 sm:gap-3",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {/* Build Your Bundle promo */}
      <Link href="/products" className={cn("group flex flex-col", itemWidth)}>
        <div className="relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-2 text-center text-white shadow-md shadow-red-900/25 transition-transform duration-300 group-hover:-translate-y-1 sm:rounded-3xl sm:p-3">
          <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[0.5rem] font-extrabold uppercase tracking-wide text-primary-foreground sm:text-[0.6rem]">
            Save 10%
          </span>
          <Gift className="mt-3 size-6 sm:size-8" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-[0.6rem] font-medium sm:text-xs">Build Your</p>
            <p className="font-display text-base font-extrabold uppercase sm:text-xl">Bundle</p>
          </div>
        </div>
        <p className="mt-2 text-center font-display text-[0.7rem] font-bold uppercase leading-tight tracking-tight sm:text-sm">
          Bundles
        </p>
        <p className="line-clamp-1 text-center text-[0.65rem] text-muted-foreground sm:text-xs">
          Save more
        </p>
      </Link>

      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className={cn("group flex flex-col", itemWidth)}
        >
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[oklch(0.97_0.045_98)] to-[oklch(0.99_0.02_98)] p-2.5 shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/15 sm:rounded-3xl sm:p-4">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="text-3xl sm:text-5xl">{c.emoji || "🏷️"}</span>
            )}
          </div>
          <p className="mt-2 text-center font-display text-[0.7rem] font-bold uppercase leading-tight tracking-tight sm:text-sm">
            {c.name}
          </p>
          <p className="line-clamp-1 text-center text-[0.65rem] text-muted-foreground sm:text-xs">
            {c.tagline || `${c.productCount} products`}
          </p>
        </Link>
      ))}
    </div>
  );
}
