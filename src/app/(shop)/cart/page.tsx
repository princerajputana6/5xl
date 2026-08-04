"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, totalItems, updateQty, removeItem, isHydrated } = useCart();

  if (!isHydrated) {
    return <div className="container-5xl py-20 text-center text-muted-foreground">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-5xl py-10">
        <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">Your Cart</h1>
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

  const shipping = subtotal >= 999 ? 0 : 79;
  const total = subtotal + shipping;

  return (
    <div className="container-5xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        Your Cart <span className="text-muted-foreground">({totalItems})</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4">
              <Link
                href={`/products/${item.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
              >
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-2xl">🥤</span>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary">
                      {item.name}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <QuantitySelector
                    value={item.qty}
                    onChange={(q) => updateQty(item.productId, item.variantId, q)}
                  />
                  <span className="font-semibold">{formatINR(item.price * item.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-border p-6">
          <h2 className="font-display text-xl font-bold uppercase">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "FREE" : formatINR(shipping)}</dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-muted-foreground">
                Add {formatINR(999 - subtotal)} more for free shipping.
              </p>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>

          <Button asChild className="mt-5 w-full" size="lg">
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
