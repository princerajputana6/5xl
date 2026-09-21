"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { ProductImage } from "@/components/shop/product-image";
import { CartRewardBar } from "@/components/shop/cart-reward-bar";
import { formatINR } from "@/lib/format";

/**
 * Mobile-only "just added to cart" bar. Pops up whenever addItem fires and
 * stays put — dismissible with the close button — so a shopper can keep
 * browsing and jump straight to checkout without hunting for the cart icon.
 * Hidden on the cart and checkout pages themselves, where it'd be redundant.
 */
export function MobileCartBar() {
  const { items, totalItems, subtotal, lastAdded, barOpen, dismissBar } = useCart();
  const pathname = usePathname();

  const hiddenRoute =
    pathname === "/cart" || pathname.startsWith("/checkout") || pathname.startsWith("/admin");
  if (!barOpen || hiddenRoute || items.length === 0) return null;

  const display = lastAdded ?? items[items.length - 1];

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 animate-in slide-in-from-bottom duration-300 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4rem)" }}
    >
      <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
            <ProductImage
              src={display.image}
              alt={display.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <ShoppingBag className="size-3.5" />
              Added to cart
            </p>
            <p className="line-clamp-1 text-sm text-muted-foreground">{display.name}</p>
          </div>

          <button
            type="button"
            aria-label="Dismiss"
            onClick={dismissBar}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <CartRewardBar subtotal={subtotal} className="m-3 rounded-lg border-none bg-transparent" />

        <Link
          href="/checkout"
          className="flex items-center justify-between gap-3 bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors active:bg-primary/90"
        >
          <span>
            {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
            <strong className="font-display">{formatINR(subtotal)}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            Checkout
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
