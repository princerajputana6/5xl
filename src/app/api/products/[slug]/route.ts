import { NextResponse } from "next/server";
import { getProductBySlug } from "@/server/services/catalog.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (err) {
    console.error("GET /api/products/[slug]", err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
