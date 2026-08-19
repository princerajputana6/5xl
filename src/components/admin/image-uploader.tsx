"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ImagePlus,
  X,
  Star,
  Loader2,
  Link as LinkIcon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** The storefront gallery shows at most this many photos per product. */
export const MAX_IMAGES = 10;

/**
 * Admin image manager. Uploads via /api/admin/uploads (Cloudinary or the local
 * fallback), shows thumbnails, and supports removing, reordering and pasting an
 * external URL. `value[0]` is the primary image used on cards and listings.
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
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [urlDraft, setUrlDraft] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);

  const remaining = MAX_IMAGES - value.length;
  const full = remaining <= 0;

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    if (full) {
      toast.error(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    const accepted = list.slice(0, remaining);
    if (accepted.length < list.length) {
      toast.warning(`Only ${accepted.length} more image(s) fit — the rest were skipped.`);
    }

    setUploading(true);
    setProgress({ done: 0, total: accepted.length });

    const added: string[] = [];
    for (const [i, file] of accepted.entries()) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? `Upload failed for ${file.name}.`);
        } else {
          added.push(data.url);
        }
      } catch {
        toast.error(`Upload failed for ${file.name}.`);
      }
      setProgress({ done: i + 1, total: accepted.length });
    }

    setUploading(false);
    setProgress(null);

    if (added.length) {
      onChange([...value, ...added]);
      toast.success(`${added.length} image${added.length === 1 ? "" : "s"} uploaded.`);
    }
  }

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makePrimary = (i: number) =>
    onChange([value[i], ...value.filter((_, idx) => idx !== i)]);

  /** Swaps an image with its neighbour so admins can set the gallery order. */
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (full) {
      toast.error(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/")) {
      toast.error("Enter a valid image URL.");
      return;
    }
    if (value.includes(u)) {
      toast.error("That image is already added.");
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
        tabIndex={full ? -1 : 0}
        aria-disabled={full}
        onClick={() => !full && inputRef.current?.click()}
        onKeyDown={(e) =>
          !full && (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!full) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-all duration-200",
          full
            ? "cursor-not-allowed border-border opacity-60"
            : "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
          dragOver && "scale-[1.01] border-primary bg-primary/10"
        )}
      >
        {uploading ? (
          <Loader2 className="size-7 animate-spin text-primary" />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-primary/15">
            <ImagePlus className="size-6 text-primary" />
          </span>
        )}

        <p className="text-sm font-medium">
          {uploading
            ? `Uploading ${progress?.done ?? 0} of ${progress?.total ?? 0}…`
            : full
              ? `Image limit reached (${MAX_IMAGES})`
              : "Click or drag images here"}
        </p>

        {!uploading && !full && (
          <p className="text-xs text-muted-foreground">
            PNG, JPG or WEBP · {remaining} slot{remaining === 1 ? "" : "s"} left
          </p>
        )}

        {uploading && progress && (
          <span className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full bg-primary transition-[width] duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </span>
        )}

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
          disabled={full}
        />
        <Button type="button" variant="outline" onClick={addUrl} disabled={full}>
          <LinkIcon className="mr-1 size-4" /> Add
        </Button>
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {value.length} of {MAX_IMAGES} · the first image is used on cards and listings
          </p>

          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {value.map((url, i) => (
              <li
                key={`${url}-${i}`}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all",
                  i === 0 ? "border-primary ring-2 ring-primary/25" : "border-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />

                {i === 0 && (
                  <span className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-primary-foreground">
                    <Star className="size-2.5" /> Primary
                  </span>
                )}

                <span className="absolute bottom-1 right-1 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                  {i + 1}
                </span>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(i)}
                      className="rounded bg-white/90 px-2 py-1 text-[0.7rem] font-medium text-black transition-colors hover:bg-white"
                    >
                      Set primary
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move left"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded bg-white/90 p-1 text-black transition-colors hover:bg-white disabled:opacity-30"
                    >
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move right"
                      disabled={i === value.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded bg-white/90 p-1 text-black transition-colors hover:bg-white disabled:opacity-30"
                    >
                      <ArrowRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => remove(i)}
                      className="rounded bg-destructive p-1 text-white transition-colors hover:bg-destructive/80"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
