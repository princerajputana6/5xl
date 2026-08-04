"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, BadgeCheck, Trash2, Reply, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminReviewRow } from "@/server/services/review.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= n ? "fill-primary text-primary" : "fill-muted text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: AdminReviewRow }) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [replyText, setReplyText] = React.useState(review.reply ?? "");
  const [busy, setBusy] = React.useState(false);

  async function patch(body: object, okMsg: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Action failed.");
      return;
    }
    toast.success(okMsg);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not delete review.");
      return;
    }
    toast.success("Review deleted.");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Stars n={review.rating} />
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm">
            <span className="font-medium">{review.authorName}</span>
            <span className="text-muted-foreground"> on </span>
            {review.productSlug ? (
              <Link href={`/products/${review.productSlug}`} className="font-medium hover:text-primary">
                {review.productName}
              </Link>
            ) : (
              <span className="font-medium">{review.productName}</span>
            )}
            <span className="text-muted-foreground"> · {formatDate(review.createdAt)}</span>
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            STATUS_STYLES[review.status]
          )}
        >
          {review.status}
        </span>
      </div>

      {review.title && <p className="mt-3 font-semibold">{review.title}</p>}
      <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>

      {review.reply && !replyOpen && (
        <div className="mt-3 rounded-lg border-l-2 border-primary bg-muted/40 p-3 text-sm">
          <p className="font-medium">Your reply</p>
          <p className="text-muted-foreground">{review.reply}</p>
        </div>
      )}

      {replyOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Write a public reply…"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={busy || !replyText.trim()}
              onClick={() => patch({ reply: replyText }, "Reply posted.").then(() => setReplyOpen(false))}
            >
              Post reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select
          value={review.status}
          onValueChange={(v) => patch({ setStatus: v }, `Marked ${v}.`)}
        >
          <SelectTrigger className="h-8 w-32 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {!replyOpen && (
          <Button size="sm" variant="outline" onClick={() => setReplyOpen(true)} disabled={busy}>
            <Reply className="mr-1 size-3.5" /> {review.reply ? "Edit reply" : "Reply"}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-destructive" onClick={remove} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export function ReviewsModerationClient({ reviews }: { reviews: AdminReviewRow[] }) {
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No reviews found.
        </div>
      ) : (
        reviews.map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </div>
  );
}
