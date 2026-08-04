"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialInWishlist = false,
  variant = "icon",
  className,
}: {
  productId: string;
  initialInWishlist?: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = React.useState(initialInWishlist);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const optimistic = !inWishlist;
    setInWishlist(optimistic);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        setInWishlist(!optimistic);
        toast.error("Please sign in to save products");
        router.push("/login?callbackUrl=/products");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInWishlist(data.inWishlist);
      toast.success(data.inWishlist ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      setInWishlist(!optimistic);
      toast.error("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={toggle}
        disabled={pending}
        className={className}
      >
        <Heart className={cn("mr-1.5 size-4", inWishlist && "fill-primary text-primary")} />
        {inWishlist ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:border-primary",
        className
      )}
    >
      <Heart className={cn("size-4", inWishlist && "fill-primary text-primary")} />
    </button>
  );
}
