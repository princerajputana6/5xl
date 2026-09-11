import Link from "next/link";
import type { PublicCategory } from "@/server/services/category.service";
import { cn } from "@/lib/utils";

/**
 * Square, image-first category tiles for the homepage (beastlife-style).
 * Falls back to the category emoji on a branded surface when no image is set.
 */
export function CategoryGrid({ categories }: { categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className="group flex flex-col gap-2.5 text-center"
        >
          <div
            className={cn(
              "relative aspect-square overflow-hidden rounded-2xl border border-border bg-card",
              "transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10"
            )}
          >
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-card to-card">
                <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                  {c.emoji || "🏷️"}
                </span>
              </div>
            )}
            {/* subtle bottom gradient for legibility when an image is used */}
            {c.image && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent"
              />
            )}
            {c.image && (
              <span className="absolute inset-x-2 bottom-2 line-clamp-2 font-display text-sm font-bold uppercase leading-tight tracking-tight text-white drop-shadow">
                {c.name}
              </span>
            )}
          </div>
          {!c.image && (
            <p className="font-display text-sm font-bold uppercase leading-tight tracking-tight">
              {c.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {c.productCount} product{c.productCount === 1 ? "" : "s"}
          </p>
        </Link>
      ))}
    </div>
  );
}
