"use client";

import { Gift, Check } from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  nextRewardTier,
  unlockedRewardTiers,
  rewardProgressPct,
} from "@/lib/cart-pricing";
import { cn } from "@/lib/utils";

/**
 * Tiered "spend more to unlock" offer bar. Shows how much further the shopper
 * needs to spend to reach the next reward (free shipping, then a coupon) with a
 * progress meter, plus chips for rewards already unlocked. Self-contained: pass
 * the current subtotal.
 */
export function CartRewardBar({
  subtotal,
  className,
}: {
  subtotal: number;
  className?: string;
}) {
  const next = nextRewardTier(subtotal);
  const unlocked = unlockedRewardTiers(subtotal);
  const pct = rewardProgressPct(subtotal);
  const remaining = next ? Math.max(0, next.threshold - subtotal) : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <Gift
          className={cn("size-5 shrink-0", next ? "text-primary" : "text-success")}
        />
        <p className="text-sm leading-snug">
          {next ? (
            <>
              Add <strong>{formatINR(remaining)}</strong> more to unlock{" "}
              <strong>{next.reward}</strong>
              {next.couponCode && (
                <>
                  {" "}
                  <span className="text-muted-foreground">(code {next.couponCode})</span>
                </>
              )}
              .
            </>
          ) : (
            <>
              <strong className="text-success">All rewards unlocked</strong> — enjoy!
            </>
          )}
        </p>
      </div>

      <div className="h-1.5 bg-muted">
        <div
          className={cn(
            "h-full transition-[width] duration-700 ease-out",
            next ? "bg-primary" : "bg-success"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {unlocked.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2.5 sm:px-5">
          {unlocked.map((t) => (
            <span
              key={t.threshold}
              className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
            >
              <Check className="size-3" />
              {t.reward}
              {t.couponCode ? ` · ${t.couponCode}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
