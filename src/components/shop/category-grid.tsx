import Link from "next/link";
import type { PublicCategory } from "@/server/services/category.service";
import { cn } from "@/lib/utils";

/**
 * "What's your move?" category rail (RIPPED UP / RUN-inspired): a horizontal
 * row of soft cream tiles with the category image floating inside and the name
 * + tagline sitting below each tile. Scrolls horizontally on overflow.
 */
export function CategoryGrid({ categories }: { categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  // Compact tiles: ~5.5 peek into view on mobile (a clear "scroll for more"
  // affordance), stepping up to snug fixed sizes on wider screens. Gap is kept
  // tight so the 5.5-up count stays accurate.
  const itemWidth =
    "w-[calc((100%-2.75rem)/5.5)] min-w-14 shrink-0 snap-start sm:w-24 md:w-28 lg:w-32";

  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-3 sm:gap-3",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
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
