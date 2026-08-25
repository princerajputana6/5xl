"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { CartProvider } from "./cart-provider";
import { ProteinCursor } from "@/components/fx/protein-cursor";
import { MobileCartBar } from "@/components/shop/mobile-cart-bar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryProvider>
        <CartProvider>
          {children}
          <MobileCartBar />
        </CartProvider>
        <ProteinCursor />
      </QueryProvider>
    </ThemeProvider>
  );
}
