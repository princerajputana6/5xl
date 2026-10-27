"use client";

import * as React from "react";
import { toast } from "sonner";
import { Film, X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Admin video picker for a single clip. Uploads via /api/admin/uploads
 * (Cloudinary or the local fallback), or accepts a pasted URL — a self-hosted
 * mp4/webm or a YouTube link. `value` is the resulting URL ("" when empty).
 */
export function VideoUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("That file isn't a video.");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Video upload failed.");
      } else {
        onChange(data.url);
        toast.success("Video uploaded.");
      }
    } catch {
      toast.error("Video upload failed.");
    }
    setUploading(false);
  }

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u) && !u.startsWith("/")) {
      toast.error("Enter a valid video URL (mp4/webm or YouTube).");
      return;
    }
    onChange(u);
    setUrlDraft("");
  };

  const isYouTube = /youtube\.com|youtu\.be/.test(value);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-neutral-900">
          {isYouTube ? (
            <div className="flex aspect-video items-center justify-center text-sm text-white/70">
              YouTube video linked
            </div>
          ) : (
            <video
              src={value}
              className="aspect-video w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
            />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove video"
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) =>
            !uploading && (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) uploadFile(f);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-all duration-200",
            uploading
              ? "cursor-wait border-border opacity-80"
              : "cursor-pointer hover:border-primary/60 hover:bg-primary/5",
            dragOver && "scale-[1.01] border-primary bg-primary/10"
          )}
        >
          {uploading ? (
            <Loader2 className="size-7 animate-spin text-primary" />
          ) : (
            <span className="grid size-12 place-items-center rounded-full bg-primary/15">
              <Film className="size-6 text-primary" />
            </span>
          )}
          <p className="text-sm font-medium">
            {uploading ? "Uploading video…" : "Click or drag a video here"}
          </p>
          {!uploading && (
            <p className="text-xs text-muted-foreground">MP4, WebM or MOV · up to 64MB</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="…or paste a video / YouTube URL"
          className="font-mono"
        />
        <Button type="button" variant="outline" onClick={addUrl}>
          <LinkIcon className="mr-1 size-4" /> Add
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
