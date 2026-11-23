"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * URL-driven pagination. Writes the `page` query param while preserving every
 * other filter in the URL, so list pages stay server-rendered and only ever
 * fetch one page of rows from the database.
 */
export function Pagination({
  page,
  pages,
  total,
  className,
}: {
  page: number;
  pages: number;
  total?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = React.useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  if (pages <= 1) {
    return total != null ? (
      <p className={cn("text-xs text-muted-foreground", className)}>
        {total} {total === 1 ? "item" : "items"}
      </p>
    ) : null;
  }

  // Windowed page list: first, last, and neighbours of the current page.
  const win = 1;
  const nums: (number | "ellipsis")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || (p >= page - win && p <= page + win)) {
      nums.push(p);
    } else if (nums[nums.length - 1] !== "ellipsis") {
      nums.push("ellipsis");
    }
  }

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      aria-label="Pagination"
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {pages}
        {total != null ? ` · ${total} total` : ""}
      </p>
      <div className="flex items-center gap-1">
        <Arrow href={hrefFor(page - 1)} disabled={page <= 1} label="Previous page">
          <ChevronLeft className="size-4" />
        </Arrow>
        {nums.map((n, i) =>
          n === "ellipsis" ? (
            <span key={`e${i}`} className="px-1.5 text-sm text-muted-foreground" aria-hidden>
              …
            </span>
          ) : (
            <PageNumber key={n} href={hrefFor(n)} active={n === page}>
              {n}
            </PageNumber>
          )
        )}
        <Arrow href={hrefFor(page + 1)} disabled={page >= pages} label="Next page">
          <ChevronRight className="size-4" />
        </Arrow>
      </div>
    </nav>
  );
}

function PageNumber({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  if (active) {
    return (
      <span
        aria-current="page"
        className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground admin-gold-glow"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid size-9 place-items-center rounded-lg border border-transparent text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Arrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="grid size-9 place-items-center rounded-lg text-muted-foreground/40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
    >
      {children}
    </Link>
  );
}
