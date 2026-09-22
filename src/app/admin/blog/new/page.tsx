import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = { title: "New post" };

export default async function AdminNewPostPage() {
  await requirePermission("cms:write");
  return <BlogForm />;
}
