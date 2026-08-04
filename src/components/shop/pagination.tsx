import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  searchParams,
}: {
  page: number;
  pages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  const nums = pageNumbers(page, pages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </PageLink>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <PageLink key={n} href={hrefFor(n)} active={n === page}>
            {n}
          </PageLink>
        )
      )}
      <PageLink href={hrefFor(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const cls = cn(
    "inline-grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border hover:bg-accent",
    disabled && "pointer-events-none opacity-40"
  );
  if (disabled) return <span className={cls}>{children}</span>;
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const window = 1;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - window && i <= current + window)) {
      add(i);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}
