import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export type Testimonial = {
  author: string;
  role: string;
  rating: number;
  body: string;
  avatar: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating)
              ? "fill-primary text-primary"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Customer testimonials grid/rail. Renders admin-managed quotes with a star
 * rating and author. Horizontal snap-scroll on mobile, grid on desktop.
 */
export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3",
        "sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {items.map((t, i) => (
        <figure
          key={i}
          className="flex w-[85%] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:w-auto"
        >
          <div className="flex items-center justify-between">
            <Stars rating={t.rating || 5} />
            <Quote className="size-5 text-primary/40" />
          </div>
          <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
            “{t.body}”
          </blockquote>
          <figcaption className="flex items-center gap-3 border-t border-border pt-3">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-primary">
              {t.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.avatar} alt={t.author} className="size-full object-cover" />
              ) : (
                t.author.charAt(0).toUpperCase()
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{t.author}</span>
              {t.role && (
                <span className="block truncate text-xs text-muted-foreground">{t.role}</span>
              )}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
