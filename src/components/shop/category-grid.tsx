import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PublicCategory } from "@/server/services/category.service";
import { cn } from "@/lib/utils";

/**
 * Square, image-first category tiles for the homepage (beastlife-style).
 * The name + product count always sit in a legible overlay; tiles without an
 * image fall back to the category emoji on a branded gradient.
 */
export function CategoryGrid({ categories }: { categories: PublicCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/products?category=${c.slug}`}
          className={cn(
            "group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card",
            "transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/10"
          )}
        >
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image}
              alt={c.name}
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 via-card to-card">
              <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                {c.emoji || "🏷️"}
              </span>
            </div>
          )}

          {/* legibility gradient */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
          />

          {/* hover arrow chip */}
          <span className="absolute right-2.5 top-2.5 grid size-7 translate-y-1 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>

          <div className="absolute inset-x-2.5 bottom-2.5">
            <p className="line-clamp-2 font-display text-sm font-bold uppercase leading-tight tracking-tight text-white drop-shadow">
              {c.name}
            </p>
            <p className="mt-0.5 text-[0.7rem] font-medium text-white/70">
              {c.productCount} product{c.productCount === 1 ? "" : "s"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
