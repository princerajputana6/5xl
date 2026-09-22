import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { getPostAdmin } from "@/server/services/blog.service";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = { title: "Edit post" };

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("cms:write");
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();
  return <BlogForm post={post} />;
}
