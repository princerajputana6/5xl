"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { shopByGoal } from "@/lib/site";
import { MobileNavLinks } from "./main-nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-col px-4 pb-6">
          <MobileNavLinks onNavigate={() => setOpen(false)} />

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Shop by goal
          </p>
          {shopByGoal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
