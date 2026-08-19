"use client";

import * as React from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OfferDTO = {
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
};

export function OffersStrip({ offers }: { offers: OfferDTO[] }) {
  const [copied, setCopied] = React.useState<string | null>(null);

  if (offers.length === 0) return null;

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success(`Coupon ${code} copied — apply it at checkout`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy the code");
    }
  }

  return (
    <div>
      <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide">
        <Sparkles className="size-4 text-primary" />
        Available offers
      </p>

      <ul className="mt-3 space-y-2.5">
        {offers.map((o) => {
          const isCopied = copied === o.code;
          return (
            <li
              key={o.code}
              className={cn(
                "group relative flex items-stretch overflow-hidden rounded-xl border border-border bg-card",
                "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              )}
            >
              {/* Ticket stub */}
              <div className="relative flex w-16 shrink-0 items-center justify-center bg-primary">
                <span className="font-display text-lg font-extrabold leading-none text-primary-foreground">
                  {o.type === "percent" ? `${o.value}%` : `₹${o.value}`}
                </span>
                {/* Perforation notches punched out of the divide */}
                <span
                  aria-hidden
                  className="absolute -right-2 -top-2 size-4 rounded-full bg-background"
                />
                <span
                  aria-hidden
                  className="absolute -bottom-2 -right-2 size-4 rounded-full bg-background"
                />
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-3 border-l border-dashed border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {o.type === "percent" ? `${o.value}% off` : `${formatINR(o.value)} off`}
                    {o.minOrder > 0 && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        above {formatINR(o.minOrder)}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{o.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => copy(o.code)}
                  aria-label={`Copy coupon code ${o.code}`}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-primary px-2.5 py-1.5",
                    "font-mono text-xs font-bold uppercase tracking-wider",
                    "transition-all duration-200 hover:border-solid hover:bg-primary hover:text-primary-foreground active:scale-95",
                    isCopied && "border-solid bg-success text-white"
                  )}
                >
                  {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {isCopied ? "Copied" : o.code}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
