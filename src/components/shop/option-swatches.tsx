import Link from "next/link";
import type { ProductOption } from "@/server/services/catalog.service";
import { cn } from "@/lib/utils";

/**
 * Flavour / pack-size selector. Each option is a different product in the
 * catalogue, so the swatches are links rather than local state.
 */
export function OptionSwatches({
  label,
  current,
  options,
}: {
  label: string;
  current: string | null;
  options: ProductOption[];
}) {
  if (options.length < 2) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">
        {label}:{" "}
        <span className="font-normal text-muted-foreground">{current ?? "Select"}</span>
      </p>
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
    </div>
  );
}
