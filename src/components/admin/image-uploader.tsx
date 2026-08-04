"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, X, Star, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Admin image manager. Uploads via /api/admin/uploads (Cloudinary or the local
 * fallback), shows thumbnails, supports removing, promoting to primary, and
 * pasting an external URL. `value[0]` is the primary image.
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Upload failed.");
          continue;
        }
        added.push(data.url);
      } catch {
        toast.error("Upload failed.");
      }
    }
    setUploading(false);
    if (added.length) {
      onChange([...value, ...added]);
      toast.success(`${added.length} image(s) uploaded.`);
    }
  }

  const remove = (url: string) => onChange(value.filter((u) => u !== url));
  const makePrimary = (url: string) => onChange([url, ...value.filter((u) => u !== url)]);

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/")) {
      toast.error("Enter a valid image URL.");
      return;
    }
    onChange([...value, u]);
    setUrlDraft("");
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
        )}
        data-cursor="grow"
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading…" : "Click or drag images here to upload"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Paste URL */}
      <div className="flex gap-2">
        <Input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="…or paste an image URL"
        />
        <Button type="button" variant="outline" onClick={addUrl}>
          <LinkIcon className="mr-1 size-4" /> Add
        </Button>
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <li
              key={url}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                i === 0 ? "border-primary" : "border-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-primary-foreground">
                  <Star className="size-2.5" /> Primary
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(url)}
                    className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-black hover:bg-white"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => remove(url)}
                  className="rounded bg-destructive/90 p-1.5 text-white hover:bg-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
