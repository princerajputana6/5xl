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
} from "lucide-react";
import type { Permission } from "@/server/rbac";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm?: Permission;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, perm: "orders:read" },
  { href: "/admin/sales", label: "Sales & Analytics", icon: TrendingUp, perm: "reports:read" },
  { href: "/admin/products", label: "Products", icon: Package, perm: "products:read" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "cms:write" },
  { href: "/admin/brands", label: "Brands", icon: Tags, perm: "cms:write" },
  { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, perm: "cms:write" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, perm: "cms:write" },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, perm: "coupons:write" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, perm: "cms:write" },
  { href: "/admin/customers", label: "Customers", icon: Users, perm: "customers:read" },
];

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

  const items = NAV.filter((n) => !n.perm || permissions.includes(n.perm));

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside
        data-admin-chrome
        className="hidden border-r border-border bg-card/40 p-4 lg:flex lg:flex-col"
      >
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2">
          <span className="font-display text-2xl font-extrabold uppercase tracking-tight">
            5<span className="text-primary">XL</span>
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
            Admin
          </span>
        </Link>
        {nav}
        <div className="mt-auto space-y-3 pt-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Store className="size-4" /> Back to store
          </Link>
          <div className="rounded-lg border border-border p-3 text-xs">
            <p className="font-medium">{userName}</p>
            <p className="text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        data-admin-chrome
        className="flex items-center justify-between border-b border-border p-4 lg:hidden"
      >
        <Link href="/admin" className="font-display text-xl font-extrabold uppercase">
          5<span className="text-primary">XL</span> Admin
        </Link>
        <button aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="border-b border-border p-4 lg:hidden">
          {nav}
          <Link
            href="/"
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <Store className="size-4" /> Back to store
          </Link>
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8 print:p-0">{children}</main>
    </div>
  );
}
