"use client";

import * as React from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Shares the product via the native share sheet where available, and falls back
 * to copying the link to the clipboard everywhere else.
 */
export function ShareButton({
  title,
  className,
  variant = "icon",
}: {
  title: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const [copied, setCopied] = React.useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet — fall through to copying instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  const Icon = copied ? Check : Share2;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={share}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium",
          "transition-all hover:border-primary hover:bg-accent active:scale-95",
          className
        )}
      >
        <Icon className="size-4" />
        {copied ? "Copied" : "Share"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this product"
      className={cn(
        "grid size-9 place-items-center rounded-full border border-border bg-background/90 backdrop-blur",
        "transition-all hover:scale-110 hover:border-primary hover:text-primary active:scale-95",
        className
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
