import type { Metadata } from "next";
import Link from "next/link";
import { Package, Heart, Sparkles, LogOut } from "lucide-react";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My Account · 5XL" };

const CARDS = [
  { href: "/account/orders", icon: Package, title: "My orders", desc: "Track and review your orders" },
  { href: "/account/rewards", icon: Sparkles, title: "Rewards & wallet", desc: "Points, credit and history" },
  { href: "/account/wishlist", icon: Heart, title: "Wishlist", desc: "Products you've saved" },
];

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="container-5xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Hi, {user.name ?? "athlete"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Link
          href="/api/auth/signout"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-4" /> Sign out
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <Icon className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-bold uppercase">{title}</h2>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
