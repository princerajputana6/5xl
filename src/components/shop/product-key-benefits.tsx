import { CheckCircle2 } from "lucide-react";

export type ProductKeyBenefit = {
  title: string;
  description: string;
  images: string[];
};

/**
 * Admin-authored key benefits for a product. Each benefit can carry body text
 * and/or one or more images, so the section adapts between image-led and
 * text-led cards.
 */
export function ProductKeyBenefits({ items }: { items: ProductKeyBenefit[] }) {
  const shown = items.filter((b) => b.title.trim() || b.images.length > 0);
  if (shown.length === 0) return null;

  return (
    <section className="mt-10 md:mt-14">
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">
        Key Benefits
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b, i) => {
          const hasImages = b.images.length > 0;
          return (
            <div
              key={`${b.title}-${i}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
            >
              {hasImages && (
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.images[0]}
                    alt={b.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                {!hasImages && (
                  <span className="mb-3 grid size-11 place-items-center rounded-full bg-primary/15">
                    <CheckCircle2 className="size-5 text-primary" />
                  </span>
                )}
                {b.title && (
                  <p className="font-display text-base font-bold uppercase tracking-tight">
                    {b.title}
                  </p>
                )}
                {b.description && (
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                )}

                {/* Extra images (when more than one was uploaded) */}
                {b.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {b.images.slice(1).map((src, idx) => (
                      <span
                        key={idx}
                        className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`${b.title} ${idx + 2}`}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
