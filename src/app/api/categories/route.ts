import { NextResponse } from "next/server";
import { getFacets } from "@/server/services/catalog.service";

export async function GET() {
  try {
    const { categories } = await getFacets();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("GET /api/categories", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
