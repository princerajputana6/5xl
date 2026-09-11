import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { getHomeContentForAdmin } from "@/server/services/home.service";
import { listCategoriesAdmin } from "@/server/services/category.service";
import { HomepageClient } from "@/components/admin/homepage-client";

export const metadata: Metadata = { title: "Homepage" };

export default async function AdminHomepagePage() {
  await requirePermission("cms:write");
  const [content, cats] = await Promise.all([
    getHomeContentForAdmin(),
    listCategoriesAdmin(),
  ]);
  return (
    <HomepageClient
      content={content}
      categories={cats.map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}
