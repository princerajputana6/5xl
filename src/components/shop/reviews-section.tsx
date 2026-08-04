"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, BadgeCheck, Loader2 } from "lucide-react";
import { Rating } from "@/components/shop/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewDTO, ReviewSummary } from "@/types/review";

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              (hover || value) >= n
                ? "fill-primary text-primary"
                : "fill-muted text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({
  slug,
  reviews,
  summary,
  fallbackRating,
  fallbackCount,
  canReview,
  myReview,
}: {
  slug: string;
  reviews: ReviewDTO[];
  summary: ReviewSummary;
  fallbackRating: number;
  fallbackCount: number;
  canReview: boolean;
  myReview: ReviewDTO | null;
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(myReview?.rating ?? 0);
  const [title, setTitle] = React.useState(myReview?.title ?? "");
  const [body, setBody] = React.useState(myReview?.body ?? "");
  const [pending, setPending] = React.useState(false);

  const overall = summary.count > 0 ? summary.average : fallbackRating;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Pick a star rating first.");
      return;
    }
    setPending(true);
    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title: title || undefined, body }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save your review.");
      return;
    }
    toast.success(myReview ? "Review updated." : "Thanks for your review!");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Summary + form */}
      <div className="space-y-6">
        <div className="rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl font-extrabold">{overall.toFixed(1)}</span>
            <div>
              <Rating value={overall} showCount={false} size="md" />
              <p className="text-sm text-muted-foreground">
                {summary.count > 0
                  ? `${summary.count} written review${summary.count > 1 ? "s" : ""}`
                  : `${fallbackCount} ratings`}
              </p>
            </div>
          </div>

          {summary.count > 0 && (
            <div className="mt-4 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const n = summary.distribution[star];
                const pct = summary.count ? (n / summary.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-muted-foreground">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{n}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canReview ? (
          <form onSubmit={submit} className="space-y-3 rounded-xl border border-border p-6">
            <h3 className="font-display text-lg font-bold uppercase">
              {myReview ? "Update your review" : "Write a review"}
            </h3>
            <StarInput value={rating} onChange={setRating} />
            <div className="space-y-1.5">
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Great taste, mixes well"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-body">Your review</Label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What did you think?"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {myReview ? "Update review" : "Submit review"}
            </Button>
          </form>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
              Sign in
            </Link>{" "}
            to write a review.
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No written reviews yet — be the first!
          </div>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full bg-muted font-semibold uppercase">
                    {r.authorName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
                {r.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" /> Verified purchase
                  </span>
                )}
              </div>

              <div className="mt-3">
                <Rating value={r.rating} showCount={false} size="sm" />
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>

              {r.reply && (
                <div className="mt-3 rounded-lg border-l-2 border-primary bg-muted/40 p-3 text-sm">
                  <p className="font-medium">5XL replied</p>
                  <p className="text-muted-foreground">{r.reply.body}</p>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
