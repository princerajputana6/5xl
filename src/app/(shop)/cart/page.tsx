"use client";

import Link from "next/link";
import {
  Trash2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Wallet,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import { ProductImage } from "@/components/shop/product-image";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatINR, discountPct } from "@/lib/format";
import {
  shippingFor,
  computeAmounts,
  pointsEarnedFor,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/cart-pricing";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, totalItems, updateQty, removeItem, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <div className="container-5xl py-20 text-center text-muted-foreground">Loading cart…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-5xl py-10">
        <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
          Your Cart
        </h1>
        <EmptyState
          icon={<ShoppingBag className="size-10" />}
          title="Your cart is empty"
          description="Add some fuel and it'll show up here."
          actionLabel="Shop products"
          actionHref="/products"
        />
      </div>
    );
  }

  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
  const savings = Math.max(0, mrpTotal - subtotal);
  const amounts = computeAmounts(subtotal);
  const shipping = shippingFor(subtotal);
  const awayFromFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const points = pointsEarnedFor(amounts.total);

  return (
    <div className="container-5xl py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Your Cart{" "}
          <span className="text-muted-foreground">
            ({totalItems} item{totalItems === 1 ? "" : "s"})
          </span>
        </h1>
        <Link
          href="/products"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Continue shopping
        </Link>
      </div>

      {/* Free-shipping progress */}
      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Truck
            className={cn("size-5 shrink-0", shipping === 0 ? "text-success" : "text-primary")}
          />
          <p className="text-sm">
            {shipping === 0 ? (
              <>
                <strong className="text-success">Free shipping unlocked</strong> — nice one.
              </>
            ) : (
              <>
                Add <strong>{formatINR(awayFromFreeShipping)}</strong> more to unlock{" "}
                <strong>free shipping</strong>.
              </>
            )}
          </p>
        </div>
        <div className="h-1.5 bg-muted">
          <div
            className={cn(
              "h-full transition-[width] duration-700 ease-out",
              shipping === 0 ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${freeShippingPct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ---- Items ---- */}
        <ul className="space-y-4">
          {items.map((item) => {
            const pct = discountPct(item.mrp, item.price);
            const lineTotal = item.price * item.qty;
            const lineMrp = item.mrp * item.qty;

            return (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/60 hover:shadow-sm"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="line-clamp-2 font-medium leading-snug hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      {item.variantLabel && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold">{formatINR(item.price)}</span>
                        {pct > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatINR(item.mrp)}
                            </span>
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide">
                              {pct}% off
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <QuantitySelector
                      value={item.qty}
                      onChange={(q) => updateQty(item.productId, item.variantId, q)}
                    />
                    <div className="text-right">
                      <p className="font-display text-lg font-bold leading-none">
                        {formatINR(lineTotal)}
                      </p>
                      {lineMrp > lineTotal && (
                        <p className="mt-1 text-xs text-muted-foreground line-through">
                          {formatINR(lineMrp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ---- Summary ---- */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />

            <h2 className="font-display text-xl font-bold uppercase tracking-tight">
              Order Summary
            </h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Subtotal <span className="text-xs">({totalItems} items)</span>
                </dt>
                <dd>{formatINR(mrpTotal)}</dd>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-success">
                  <dt className="flex items-center gap-1.5">
                    <Tag className="size-3.5" /> Product discount
                  </dt>
                  <dd>-{formatINR(savings)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className={cn(shipping === 0 && "font-semibold text-success")}>
                  {shipping === 0 ? "FREE" : formatINR(shipping)}
                </dd>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-border pt-3">
                <dt className="font-display text-base font-bold uppercase">Total</dt>
                <dd className="font-display text-2xl font-extrabold">
                  {formatINR(amounts.total)}
                </dd>
              </div>
              <p className="text-right text-xs text-muted-foreground">Inclusive of all taxes</p>
            </dl>

            {savings > 0 && (
              <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-center text-sm font-medium text-success">
                You&apos;re saving {formatINR(savings)} on this order
              </p>
            )}

            {points > 0 && (
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-center text-sm">
                <Wallet className="size-4 text-primary" />
                Earn <strong>{points}</strong> reward points
              </p>
            )}

            <Button asChild className="mt-5 w-full transition-transform active:scale-95" size="lg">
              <Link href="/checkout">
                Proceed to checkout
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>

          {/* Trust row */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border p-4">
            {[
              { icon: Truck, title: "Fast delivery", sub: "2-5 days" },
              { icon: RotateCcw, title: "7-day returns", sub: "T&C apply" },
              { icon: ShieldCheck, title: "Authentic", sub: "Lab tested" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="group flex flex-col items-center gap-1 text-center">
                <Icon className="size-5 text-primary transition-transform duration-200 group-hover:-translate-y-0.5" />
                <p className="text-xs font-semibold leading-tight">{title}</p>
                <p className="text-[0.7rem] leading-tight text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
