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

  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {/* Build Your Bundle promo */}
      <Link
        href="/products"
        className="group flex w-36 shrink-0 snap-start flex-col sm:w-40"
      >
        <div className="relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-red-800 p-4 text-center text-white shadow-lg shadow-red-900/25 transition-transform duration-300 group-hover:-translate-y-1">
          <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-primary-foreground">
            Save 10%
          </span>
          <Gift className="mt-4 size-9" strokeWidth={1.75} />
          <div className="leading-tight">
            <p className="text-xs font-medium">Build Your</p>
            <p className="font-display text-xl font-extrabold uppercase">Bundle</p>
          </div>
        </div>
        <p className="mt-3 text-center font-display text-sm font-bold uppercase tracking-tight">
          Bundles
        </p>
        <p className="text-center text-xs text-muted-foreground">Save more</p>
      </Link>

      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className="group flex w-36 shrink-0 snap-start flex-col sm:w-40"
        >
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[oklch(0.97_0.045_98)] to-[oklch(0.99_0.02_98)] p-4 shadow-sm ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/15">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="text-5xl">{c.emoji || "🏷️"}</span>
            )}
          </div>
          <p className="mt-3 text-center font-display text-sm font-bold uppercase leading-tight tracking-tight">
            {c.name}
          </p>
          <p className="line-clamp-1 text-center text-xs text-muted-foreground">
            {c.tagline || `${c.productCount} products`}
          </p>
        </Link>
      ))}
    </div>
  );
}
