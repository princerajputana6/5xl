import Link from "next/link";
import type { ProductOption } from "@/server/services/catalog.service";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Flavour / pack-size selector. Each option is a different product in the
 * catalogue, so the swatches are links rather than local state.
 *
 * - `variant="flavour"` renders image chips (photo + name) like a flavour picker.
 * - `variant="size"` renders pack tiles showing the per-kg price + pack weight.
 */
export function OptionSwatches({
  label,
  current,
  options,
  variant = "text",
}: {
  label: string;
  current: string | null;
  options: ProductOption[];
  variant?: "text" | "flavour" | "size";
}) {
  if (options.length < 2) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">
        {label}:{" "}
        <span className="font-normal text-muted-foreground">{current ?? "Select"}</span>
      </p>

      {variant === "flavour" ? (
        <div className="flex flex-wrap gap-2.5">
          {options.map((o) => (
            <Link
              key={o.slug}
              href={`/products/${o.slug}`}
              aria-current={o.isCurrent ? "true" : undefined}
              title={o.label}
              className={cn(
                "group flex w-[84px] flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
                o.isCurrent ? "border-primary ring-1 ring-primary/30" : "border-border",
                !o.inStock && "opacity-60"
              )}
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.image}
                    alt={o.label}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg">🥤</span>
                )}
                {!o.inStock && (
                  <span className="absolute inset-0 grid place-items-center bg-background/60 text-[0.6rem] font-semibold uppercase text-muted-foreground">
                    Sold out
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-[0.7rem] font-medium leading-tight",
                  o.isCurrent && "text-primary"
                )}
              >
                {o.label}
              </span>
            </Link>
          ))}
        </div>
      ) : variant === "size" ? (
        <div className="flex flex-wrap gap-2.5">
          {options.map((o) => (
            <Link
              key={o.slug}
              href={`/products/${o.slug}`}
              aria-current={o.isCurrent ? "true" : undefined}
              className={cn(
                "relative flex min-w-[92px] flex-col items-start gap-0.5 rounded-xl border px-3 py-2 transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
                o.isCurrent ? "border-primary bg-accent ring-1 ring-primary/30" : "border-border",
                !o.inStock && "opacity-50 line-through"
              )}
            >
              {o.pricePerKg != null && (
                <span className="text-[0.7rem] font-medium text-muted-foreground">
                  {formatINR(o.pricePerKg)}/kg
                </span>
              )}
              <span className={cn("font-display text-base font-bold", o.isCurrent && "text-primary")}>
                {o.label}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <Link
              key={o.slug}
              href={`/products/${o.slug}`}
              aria-current={o.isCurrent ? "true" : undefined}
              className={cn(
                "relative rounded-md border px-3.5 py-2 text-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
                o.isCurrent
                  ? "border-primary bg-accent font-semibold shadow-sm ring-1 ring-primary/30"
                  : "border-border",
                !o.inStock && "text-muted-foreground line-through decoration-muted-foreground/60"
              )}
            >
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
