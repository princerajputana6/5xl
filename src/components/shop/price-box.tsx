import { formatINR, discountPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceBox({
  price,
  mrp,
  size = "sm",
  className,
}: {
  price: number;
  mrp: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const pct = discountPct(mrp, price);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold", size === "lg" ? "text-2xl" : "text-base")}>
        {formatINR(price)}
      </span>
      {pct > 0 && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through",
              size === "lg" ? "text-base" : "text-sm"
            )}
          >
            {formatINR(mrp)}
          </span>
          <span
            className={cn(
              "font-semibold text-success",
              size === "lg" ? "text-sm" : "text-xs"
            )}
          >
            {pct}% off
          </span>
        </>
      )}
    </div>
  );
}
