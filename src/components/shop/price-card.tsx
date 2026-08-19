import { formatINR, discountPct } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Product-page price panel: the payable price, the struck MRP and a saving
 * ribbon, framed so the whole block reads as one unit.
 */
export function PriceCard({
  price,
  mrp,
  className,
}: {
  price: number;
  mrp: number;
  className?: string;
}) {
  const pct = discountPct(mrp, price);
  const saved = Math.max(0, mrp - price);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card",
        "transition-colors duration-300 hover:border-primary/70",
        className
      )}
    >
      {/* Brand wash that drifts on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/15 blur-2xl transition-transform duration-500 group-hover:translate-x-2 group-hover:scale-110"
      />

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
        <span className="font-display text-4xl font-extrabold leading-none tracking-tight">
          {formatINR(price)}
        </span>

        {pct > 0 && (
          <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
            {formatINR(mrp)}
          </span>
        )}

        {pct > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
            Save {pct}%
          </span>
        )}

        <span className="ml-auto text-right text-xs leading-tight text-muted-foreground">
          Inclusive
          <br />
          of all taxes
        </span>
      </div>

      {saved > 0 && (
        <p className="relative border-t border-dashed border-border bg-muted/40 px-5 py-2 text-xs font-medium">
          You save <span className="text-success">{formatINR(saved)}</span> on this order
        </p>
      )}
    </div>
  );
}
