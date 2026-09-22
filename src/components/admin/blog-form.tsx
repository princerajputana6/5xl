"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { BlogPostInput } from "@/lib/validators/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/admin/image-uploader";

type PostWithId = BlogPostInput & { id: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogForm({ post }: { post?: PostWithId }) {
  const router = useRouter();
  const editing = Boolean(post);

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [slug, setSlug] = React.useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(editing);
  const [category, setCategory] = React.useState(post?.category ?? "General");
  const [author, setAuthor] = React.useState(post?.author ?? "The 5XL Nutrition");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = React.useState(post?.coverImage ?? "");
  const [tags, setTags] = React.useState((post?.tags ?? []).join(", "));
  const [status, setStatus] = React.useState<"draft" | "published">(post?.status ?? "published");
  const [contentHtml, setContentHtml] = React.useState(post?.contentHtml ?? "");
  const [seoTitle, setSeoTitle] = React.useState(post?.seo?.title ?? "");
  const [seoDesc, setSeoDesc] = React.useState(post?.seo?.description ?? "");
  const [pending, setPending] = React.useState(false);

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function save() {
    if (title.trim().length < 3) return toast.error("Title is required.");
    if (slug.trim().length < 2) return toast.error("Slug is required.");
    setPending(true);
    const payload: BlogPostInput = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || undefined,
      coverImage: coverImage || undefined,
      contentHtml,
      category: category.trim() || "General",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: author.trim() || undefined,
      status,
      seo: { title: seoTitle.trim() || undefined, description: seoDesc.trim() || undefined },
    };
    const url = editing ? `/api/admin/blog/${post!.id}` : "/api/admin/blog";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return toast.error(data.error ?? "Could not save post.");
    toast.success(editing ? "Post updated." : "Post created.");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          {editing ? "Edit post" : "New post"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/blog")}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* main */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Best protein powder in India" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">/blog/{slug || "…"}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Excerpt</Label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              maxLength={400}
              className="w-full rounded-md border border-input bg-background p-2 text-sm"
              placeholder="One or two lines shown on the blog list and in search results."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Content (HTML)</Label>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={20}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm"
              placeholder="<h2>Heading</h2><p>Write your article using HTML tags…</p>"
            />
            <p className="text-xs text-muted-foreground">
              Supports headings, paragraphs, lists, links, images, tables and embeds — the same
              format as the existing site articles.
            </p>
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-xl border border-border p-4">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="space-y-1.5 rounded-xl border border-border p-4">
            <Label>Cover image</Label>
            <ImageUploader
              value={coverImage ? [coverImage] : []}
              onChange={(next) => setCoverImage(next[0] ?? "")}
            />
          </div>
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="protein, whey, india" />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">SEO</p>
            <div className="space-y-1.5">
              <Label>Meta title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta description</Label>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
