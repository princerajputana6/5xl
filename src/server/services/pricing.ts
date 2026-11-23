import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { products } from "@/server/schema";
import { HttpError } from "@/server/errors";

export type CartLineInput = {
  productId: string;
  variantId?: string | null;
  qty: number;
};

export type PricedLine = {
  product: string;
  slug: string;
  name: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  price: number;
  mrp: number;
  qty: number;
  lineTotal: number;
};

/**
 * Price a cart against the database — the single source of truth for money.
 * Never trusts client-supplied prices. Throws HttpError(409) on unavailable
 * items / variants / insufficient stock.
 */
export async function priceCartItems(
  items: CartLineInput[]
): Promise<{ lines: PricedLine[]; subtotal: number }> {
  const lines: PricedLine[] = [];
  let subtotal = 0;

  for (const line of items) {
    const product = await db()
      .select()
      .from(products)
      .where(and(eq(products.id, line.productId), eq(products.status, "active")))
      .get();
    if (!product) {
      throw new HttpError("A product in your cart is no longer available.", 409);
    }

    let price = product.price;
    let mrp = product.mrp;
    let variantLabel: string | null = null;
    let stock = product.stock ?? 0;

    if (line.variantId) {
      const variant = (product.variants ?? []).find((v) => v.id === line.variantId);
      if (!variant) {
        throw new HttpError("A selected variant is no longer available.", 409);
      }
      price = variant.price;
      mrp = variant.mrp;
      variantLabel = variant.label;
      stock = variant.stock ?? 0;
    }

    if (stock < line.qty) {
      throw new HttpError(`"${product.name}" is out of stock.`, 409);
    }

    const lineTotal = price * line.qty;
    subtotal += lineTotal;

    lines.push({
      product: product.id,
      slug: product.slug,
      name: product.name,
      image: (product.images ?? [])[0] ?? null,
      variantId: line.variantId ?? null,
      variantLabel,
      price,
      mrp,
      qty: line.qty,
      lineTotal,
    });
  }

  return { lines, subtotal };
}
