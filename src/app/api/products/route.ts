import { NextResponse } from "next/server";
import { listProducts } from "@/server/services/catalog.service";
import type { SortValue } from "@/types/catalog";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const num = (k: string) => {
    const v = searchParams.get(k);
    return v != null && v !== "" ? Number(v) : undefined;
  };

  try {
    const result = await listProducts({
      category: searchParams.get("category") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      goal: searchParams.get("goal") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      sort: (searchParams.get("sort") as SortValue) ?? undefined,
      page: num("page"),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/products", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
