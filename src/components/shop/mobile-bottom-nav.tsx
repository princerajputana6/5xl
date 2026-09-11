"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Home, LayoutGrid, ShoppingBag, Heart, User, type LucideProps } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  /** matches when the path starts with this (defaults to exact for "/"). */
  match?: (path: string) => boolean;
  badge?: "cart";
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/products", label: "Shop", icon: LayoutGrid, match: (p) => p.startsWith("/products") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p) => p.startsWith("/cart"), badge: "cart" },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, match: (p) => p.startsWith("/account/wishlist") },
  { href: "/account", label: "Account", icon: User, match: (p) => p.startsWith("/account") && !p.startsWith("/account/wishlist") },
];

/**
 * Mobile-only bottom tab bar (hidden on lg+). A single pill indicator slides
 * left/right to the tab you tap, using a spring so the motion feels physical.
 * Hidden on the admin portal, which has its own chrome.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { totalItems, isHydrated } = useCart();

  if (pathname.startsWith("/admin")) return null;

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => (t.match ? t.match(pathname) : pathname.startsWith(t.href)))
  );
  const widthPct = 100 / TABS.length;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto flex max-w-lg">
        {/* Sliding pill indicator */}
        <motion.span
          aria-hidden
          className="absolute top-1.5 z-0 rounded-2xl bg-primary/12"
          style={{ width: `calc(${widthPct}% - 12px)`, height: "calc(100% - 12px)", left: "6px" }}
          animate={{ x: `${activeIndex * 100}%` }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
          }
        />

        {TABS.map((t, i) => {
          const active = i === activeIndex;
          const Icon = t.icon;
          const showBadge = t.badge === "cart" && isHydrated && totalItems > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              style={{ flexBasis: `${widthPct}%` }}
            >
              <span className="relative">
                <motion.span
                  className="block"
                  animate={reduce ? undefined : { y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Icon
                    className={cn(
                      "size-5.5 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </motion.span>
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold leading-4 text-primary-foreground">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[0.62rem] font-medium leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
