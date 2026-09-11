"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Heart, User, type LucideProps } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  match: (path: string) => boolean;
  badge?: "cart";
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/products", label: "Shop", icon: LayoutGrid, match: (p) => p.startsWith("/products") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p.startsWith("/cart"), badge: "cart" },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, match: (p) => p.startsWith("/account/wishlist") },
  {
    href: "/account",
    label: "Account",
    icon: User,
    match: (p) => p.startsWith("/account") && !p.startsWith("/account/wishlist"),
  },
];

/**
 * Mobile-only bottom tab bar (hidden on lg+). The active-tab pill slides
 * left/right using a single GPU-composited CSS transform (translateX) — no
 * per-frame JS and no backdrop-blur, so it stays buttery on low-end phones.
 * Hidden on the admin portal, which has its own chrome.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, isHydrated } = useCart();

  if (pathname.startsWith("/admin")) return null;

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.match(pathname))
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-border bg-card shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
        <div className="relative mx-auto flex max-w-lg px-1.5 py-1.5">
          {/* Sliding active pill (single GPU-composited transform → smooth) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1.5 left-1.5 z-0 rounded-2xl bg-primary/12 transition-transform duration-300 ease-[cubic-bezier(0.34,1.35,0.5,1)] will-change-transform"
            style={{
              width: `calc((100% - 0.75rem) / ${TABS.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {TABS.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            const showBadge = t.badge === "cart" && isHydrated && totalItems > 0;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "size-[22px] transition-all duration-300 ease-out",
                      active ? "-translate-y-px scale-110 text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                    fill={active && (t.label === "Wishlist" || t.label === "Home") ? "currentColor" : "none"}
                  />
                  {showBadge && (
                    <span className="absolute -right-2.5 -top-2 grid min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold leading-4 text-primary-foreground ring-2 ring-card">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[0.63rem] font-semibold leading-none tracking-tight transition-colors duration-300",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
