"use client";

import * as React from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  price: number;
  mrp: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQty: (productId: string, variantId: string | null, qty: number) => void;
  clear: () => void;
  isHydrated: boolean;
  /** The line just added/updated by addItem — drives the mobile "added to cart" bar. */
  lastAdded: CartItem | null;
  /** True until the shopper dismisses the bar; flips back on the next addItem call. */
  barOpen: boolean;
  dismissBar: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);
const STORAGE_KEY = "5xl.cart.v1";

const sameLine = (a: CartItem, productId: string, variantId: string | null) =>
  a.productId === productId && a.variantId === variantId;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isHydrated, setHydrated] = React.useState(false);
  const [lastAdded, setLastAdded] = React.useState<CartItem | null>(null);
  const [barOpen, setBarOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (isHydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = React.useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    let resultingLine: CartItem | null = null;
    setItems((prev) => {
      const idx = prev.findIndex((i) => sameLine(i, item.productId, item.variantId));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        resultingLine = next[idx];
        return next;
      }
      const line = { ...item, qty };
      resultingLine = line;
      return [...prev, line];
    });
    setLastAdded(resultingLine);
    setBarOpen(true);
  }, []);

  const removeItem = React.useCallback((productId: string, variantId: string | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variantId)));
  }, []);

  const updateQty = React.useCallback(
    (productId: string, variantId: string | null, qty: number) => {
      setItems((prev) =>
        prev
          .map((i) => (sameLine(i, productId, variantId) ? { ...i, qty } : i))
          .filter((i) => i.qty > 0)
      );
    },
    []
  );

  const clear = React.useCallback(() => {
    setItems([]);
    setBarOpen(false);
  }, []);

  const dismissBar = React.useCallback(() => setBarOpen(false), []);

  const totalItems = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  const value: CartContextValue = {
    items,
    totalItems,
    subtotal,
    addItem,
    removeItem,
    updateQty,
    clear,
    isHydrated,
    lastAdded,
    barOpen: barOpen && items.length > 0,
    dismissBar,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
