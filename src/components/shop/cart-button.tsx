"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

export function CartButton() {
  const { totalItems, isHydrated } = useCart();
  return (
    <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
      <Link href="/cart">
        <ShoppingBag className="size-5" />
        {isHydrated && totalItems > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-bold leading-4 text-primary-foreground">
            {totalItems}
          </span>
        )}
      </Link>
    </Button>
  );
}
