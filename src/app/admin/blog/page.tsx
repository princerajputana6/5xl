import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { listPostsAdmin } from "@/server/services/blog.service";
import { BlogClient } from "@/components/admin/blog-client";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requirePermission("cms:write");
  const rows = await listPostsAdmin();
  return <BlogClient rows={rows} />;
}
