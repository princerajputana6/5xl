"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    price: number;
    mrp: number;
  };
  variant?: { id: string; label: string; price: number; mrp: number } | null;
  qty?: number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
};

/** Adds the item to the cart and sends the shopper straight to checkout. */
export function BuyNowButton({
  product,
  variant,
  qty = 1,
  disabled,
  className,
  size = "lg",
}: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  function onClick() {
    setPending(true);
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        variantId: variant?.id ?? null,
        variantLabel: variant?.label ?? null,
        price: variant?.price ?? product.price,
        mrp: variant?.mrp ?? product.mrp,
      },
      qty
    );
    router.push("/checkout");
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      disabled={disabled || pending}
      onClick={onClick}
      className={cn(
        "border border-foreground/15 bg-foreground text-background",
        "transition-transform hover:bg-foreground/90 active:scale-95",
        className
      )}
    >
      {pending ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <Zap className="mr-1.5 size-4" />
      )}
      Buy now
    </Button>
  );
}
