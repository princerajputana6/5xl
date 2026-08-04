"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-ring",
        className
      )}
      role="search"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search protein, creatine…"
        className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        aria-label="Search products"
      />
    </form>
  );
}
