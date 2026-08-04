import Link from "next/link";
import { Heart } from "lucide-react";
import { auth } from "@/auth";
import { mainNav } from "@/lib/site";
import type { Role } from "@/server/rbac";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SearchBar } from "./search-bar";
import { MobileNav } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { CartButton } from "./cart-button";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as Role,
      }
    : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top row */}
      <div className="container-5xl flex h-16 items-center gap-4">
        <MobileNav />
        <Logo />

        <SearchBar className="mx-auto hidden w-full max-w-md lg:flex" />

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Wishlist"
          >
            <Link href="/account/wishlist">
              <Heart className="size-5" />
            </Link>
          </Button>
          <AccountMenu user={user} />
          <CartButton />
        </div>
      </div>

      {/* Nav row (desktop) */}
      <nav className="hidden border-t border-border lg:block">
        <div className="container-5xl flex h-11 items-center gap-6">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Search (mobile) */}
      <div className="container-5xl pb-3 lg:hidden">
        <SearchBar className="w-full" />
      </div>
    </header>
  );
}
