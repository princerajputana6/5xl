import { Check, CreditCard, Package, Truck, Home, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "confirmed", label: "Confirmed", icon: CreditCard },
  { status: "processing", label: "Packed", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
] as const;

const ORDER: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

/**
 * Horizontal fulfilment tracker. Cancelled and refunded orders never reach the
 * happy path, so those get their own notice instead of a half-filled bar.
 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <XCircle className="size-5 shrink-0 text-destructive" />
        <p className="text-sm font-medium">
          This order was {status}.{" "}
          <span className="font-normal text-muted-foreground">
            {status === "refunded"
              ? "The amount has been returned to your original payment method."
              : "Nothing was shipped."}
          </span>
        </p>
      </div>
    );
  }

  const current = ORDER.indexOf(status);
  // "pending" sits before the first milestone, so nothing is complete yet.
  const reached = (stepStatus: OrderStatus) => current >= ORDER.indexOf(stepStatus);
  const activeIdx = STEPS.findIndex((s) => s.status === status);
  const fillPct =
    current <= 0 ? 0 : (Math.max(0, activeIdx) / (STEPS.length - 1)) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="relative">
        {/* Track */}
        <span
          aria-hidden
          className="absolute left-[10%] right-[10%] top-5 h-0.5 -translate-y-1/2 bg-border"
        />
        <span
          aria-hidden
          className="absolute left-[10%] top-5 h-0.5 -translate-y-1/2 bg-primary transition-[width] duration-1000 ease-out"
          style={{ width: `calc((100% - 20%) * ${fillPct / 100})` }}
        />

        <ol className="relative grid grid-cols-4">
          {STEPS.map((step, i) => {
            const done = reached(step.status);
            const isCurrent = step.status === status;
            const Icon = step.icon;

            return (
              <li key={step.status} className="flex flex-col items-center gap-2 text-center">
                <span
                  style={{ animationDelay: `${i * 120}ms` }}
                  className={cn(
                    "grid size-10 place-items-center rounded-full border-2 bg-background transition-colors duration-500",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                    isCurrent && "animate-in zoom-in-50 ring-4 ring-primary/25 duration-500"
                  )}
                >
                  {done && !isCurrent ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>

                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {status === "pending" && (
        <div className="mt-5 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
          <p className="font-semibold">Waiting on payment</p>
          <p className="mt-0.5">
            We create your order before sending you to the payment page, so an attempt that was
            closed or failed part-way leaves it sitting here. Nothing has been charged and nothing
            will ship until payment completes.
          </p>
        </div>
      )}
    </div>
  );
}
