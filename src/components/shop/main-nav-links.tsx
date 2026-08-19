"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Decides which nav entry matches the current URL.
 *
 * Category links differ only by their `?category=` value, so the query string
 * has to be part of the comparison — matching on pathname alone would light up
 * every category link at once on /products.
 */
function useActiveHref(): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  let best: { href: string; score: number } | null = null;

  for (const item of mainNav) {
    const [itemPath, itemQuery] = item.href.split("?");
    if (itemPath !== pathname) continue;

    const itemCategory = itemQuery
      ? new URLSearchParams(itemQuery).get("category")
      : null;

    // An exact category match beats the bare "Shop All" entry.
    let score: number;
    if (itemCategory) score = itemCategory === category ? 2 : -1;
    else score = category ? 0 : 1;

    if (score < 0) continue;
    if (!best || score > best.score) best = { href: item.href, score };
  }

  return best?.href ?? null;
}

export function MainNavLinks() {
  const activeHref = useActiveHref();

  return (
    <div className="container-5xl flex h-11 items-center gap-6">
      {mainNav.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // inline-block so the absolutely-positioned underline below has a
              // containing block with real width to stretch across.
              "group relative inline-block py-3 font-display text-sm font-semibold uppercase tracking-wide transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full bg-primary transition-[scale] duration-300",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}

/** Same active logic, styled for the mobile sheet. */
export function MobileNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const activeHref = useActiveHref();

  return (
    <>
      {mainNav.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b border-border py-3 font-display text-lg font-semibold uppercase tracking-wide transition-colors",
              active ? "text-primary" : "hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
