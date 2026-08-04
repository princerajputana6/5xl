"use client";

import * as React from "react";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
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
  variant?: {
    id: string;
    label: string;
    price: number;
    mrp: number;
  } | null;
  qty?: number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  label?: string;
};

export function AddToCartButton({
  product,
  variant,
  qty = 1,
  disabled,
  className,
  size = "default",
  label = "Add to cart",
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = React.useState(false);

  function onClick() {
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
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={cn(className)}
    >
      {added ? (
        <>
          <Check className="mr-1.5 size-4" /> Added
        </>
      ) : (
        <>
          <ShoppingBag className="mr-1.5 size-4" /> {disabled ? "Out of stock" : label}
        </>
      )}
    </Button>
  );
}
