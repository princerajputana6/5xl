"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Tags,
  LayoutTemplate,
  Users,
  Ticket,
  Star,
  Newspaper,
  Store,
  TrendingUp,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import type { Permission } from "@/server/rbac";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm?: Permission;
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/sales", label: "Sales & Analytics", icon: TrendingUp, perm: "reports:read" },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, perm: "orders:read" },
      { href: "/admin/products", label: "Products", icon: Package, perm: "products:read" },
      { href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "cms:write" },
      { href: "/admin/brands", label: "Brands", icon: Tags, perm: "cms:write" },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, perm: "coupons:write" },
      { href: "/admin/customers", label: "Customers", icon: Users, perm: "customers:read" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, perm: "cms:write" },
      { href: "/admin/blog", label: "Blog", icon: Newspaper, perm: "cms:write" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, perm: "cms:write" },
    ],
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "5X";
}

function useAdminTheme() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    // Apply the admin theme (light by default) on mount. Done here rather than in
    // an injected <script> so it runs reliably on client-side navigation too, and
    // after next-themes has set its own class on <html>.
    let initial: "light" | "dark" = "light";
    try {
      const stored = localStorage.getItem("admin-theme");
      if (stored === "dark" || stored === "light") initial = stored;
    } catch {
      /* storage unavailable */
    }
    const root = document.documentElement;
    root.classList.remove("admin-light", "admin-dark");
    root.classList.add("admin-" + initial);
    setTheme(initial);
    // Leaving the admin: drop the admin theme so the storefront's own theme resumes.
    return () => {
      document.documentElement.classList.remove("admin-light", "admin-dark");
    };
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      const root = document.documentElement;
      root.classList.remove("admin-light", "admin-dark");
      root.classList.add("admin-" + next);
      try {
        localStorage.setItem("admin-theme", next);
      } catch {
        /* storage unavailable — theme still applies for this session */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export function AdminShell({
  permissions,
  roleLabel,
  userName,
  children,
}: {
  permissions: Permission[];
  roleLabel: string;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { theme, toggle } = useAdminTheme();

  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((n) => !n.perm || permissions.includes(n.perm)),
  })).filter((g) => g.items.length > 0);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[0.68rem] font-semibold tracking-wide text-muted-foreground/70">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/12 font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "size-[18px] transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2">
      <Logo href="/admin" />
      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-widest text-primary">
        Admin
      </span>
    </div>
  );

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
      className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {theme === "light" ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </button>
  );

  return (
    <div className="admin-root min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside
        data-admin-chrome
        className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border bg-card px-4 py-5 lg:flex admin-card"
      >
        <div className="px-1">{brand}</div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{nav}</div>
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Store className="size-[18px]" /> View store
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials(userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-col">
        {/* Top app bar */}
        <header
          data-admin-chrome
          className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8"
        >
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-card text-foreground"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            {brand}
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {themeButton}
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
            >
              <Store className="size-4" /> View store
            </Link>
          </div>
        </header>

        {/* Mobile nav drawer */}
        {open && (
          <div
            data-admin-chrome
            className="border-b border-border bg-card px-4 py-4 lg:hidden admin-card"
          >
            {nav}
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials(userName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 md:p-8 print:p-0">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
