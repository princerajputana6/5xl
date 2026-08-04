import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  showCount = true,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}) {
  const px = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(value);
          return (
            <Star
              key={i}
              className={cn(
                px,
                filled ? "fill-primary text-primary" : "fill-muted text-muted-foreground/40"
              )}
            />
          );
        })}
      </div>
      {showCount && (
        <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm")}>
          {value.toFixed(1)}
          {count != null && ` (${count})`}
        </span>
      )}
    </div>
  );
}
