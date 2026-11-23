import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { listPostsAdmin } from "@/server/services/blog.service";
import { BlogClient } from "@/components/admin/blog-client";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("cms:write");
  const { page } = await searchParams;
  const { rows, total, page: current, pages } = await listPostsAdmin({
    page: Number(page) || 1,
    pageSize: 20,
  });
  return <BlogClient rows={rows} total={total} page={current} pages={pages} />;
}
