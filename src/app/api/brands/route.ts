import { NextResponse } from "next/server";
import { listBrands } from "@/server/services/catalog.service";

export async function GET() {
  try {
    const brands = await listBrands();
    return NextResponse.json({ brands });
  } catch (err) {
    console.error("GET /api/brands", err);
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
  }
}
