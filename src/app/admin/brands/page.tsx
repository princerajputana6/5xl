import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { listBrandsAdmin } from "@/server/services/brand.service";
import { BrandsClient } from "@/components/admin/brands-client";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  await requirePermission("cms:write");
  const rows = await listBrandsAdmin();
  return <BrandsClient rows={rows} />;
}
