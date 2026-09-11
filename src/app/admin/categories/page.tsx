import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { listCategoriesAdmin } from "@/server/services/category.service";
import { CategoriesClient } from "@/components/admin/categories-client";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requirePermission("cms:write");
  const rows = await listCategoriesAdmin();
  return <CategoriesClient rows={rows} />;
}
