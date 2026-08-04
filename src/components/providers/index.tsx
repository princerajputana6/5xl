"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { CartProvider } from "./cart-provider";
import { ProteinCursor } from "@/components/fx/protein-cursor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <CartProvider>{children}</CartProvider>
        <ProteinCursor />
      </QueryProvider>
    </ThemeProvider>
  );
}
