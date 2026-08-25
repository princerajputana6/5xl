"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, BadgeCheck, Loader2, PenLine, X, MessageSquare, Filter } from "lucide-react";
import { Rating } from "@/components/shop/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReviewDTO, ReviewSummary } from "@/types/review";

type SortKey = "recent" | "highest" | "lowest";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

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
          className="p-0.5 transition-transform duration-150 hover:scale-125 active:scale-95"
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

/** Stable per-author avatar tint so the list doesn't read as a wall of grey. */
function avatarTint(name: string): string {
  const tints = [
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
    "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
    "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200",
    "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return tints[Math.abs(h) % tints.length];
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

  const [formOpen, setFormOpen] = React.useState(false);
  const [rating, setRating] = React.useState(myReview?.rating ?? 0);
  const [title, setTitle] = React.useState(myReview?.title ?? "");
  const [body, setBody] = React.useState(myReview?.body ?? "");
  const [pending, setPending] = React.useState(false);

  // The server refetches after a save, so mirror the incoming review back into
  // the form instead of leaving the fields on their now-stale first render.
  // Keyed on the review's contents, not its identity, so an unrelated refresh
  // never wipes out what the shopper is part-way through typing.
  const serverKey = myReview
    ? `${myReview.id}:${myReview.rating}:${myReview.title ?? ""}:${myReview.body}`
    : "none";
  const [syncedKey, setSyncedKey] = React.useState(serverKey);
  if (serverKey !== syncedKey) {
    setSyncedKey(serverKey);
    setRating(myReview?.rating ?? 0);
    setTitle(myReview?.title ?? "");
    setBody(myReview?.body ?? "");
  }

  const [sort, setSort] = React.useState<SortKey>("recent");
  const [starFilter, setStarFilter] = React.useState<number | null>(null);

  const overall = summary.count > 0 ? summary.average : fallbackRating;

  const visible = React.useMemo(() => {
    const list = starFilter ? reviews.filter((r) => Math.round(r.rating) === starFilter) : [...reviews];
    if (sort === "highest") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "lowest") list.sort((a, b) => a.rating - b.rating);
    else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [reviews, sort, starFilter]);

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
    setFormOpen(false);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
      {/* ---- Summary + write panel ---- */}
      <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <div className="flex items-end gap-3">
            <span className="font-display text-5xl font-extrabold leading-none">
              {overall.toFixed(1)}
            </span>
            <div className="pb-1">
              <Rating value={overall} showCount={false} size="md" />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {summary.count > 0
                  ? `${summary.count} written review${summary.count > 1 ? "s" : ""}`
                  : `${fallbackCount} ratings`}
              </p>
            </div>
          </div>

          {summary.count > 0 && (
            <div className="mt-5 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const n = summary.distribution[star];
                const pct = summary.count ? (n / summary.count) * 100 : 0;
                const activeFilter = starFilter === star;
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={n === 0}
                    onClick={() => setStarFilter(activeFilter ? null : star)}
                    aria-pressed={activeFilter}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors",
                      n > 0 ? "hover:bg-accent/60" : "cursor-default opacity-50",
                      activeFilter && "bg-accent"
                    )}
                  >
                    <span className="w-6 shrink-0 text-left text-muted-foreground">{star}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-5 shrink-0 text-right text-muted-foreground">{n}</span>
                  </button>
                );
              })}
              {starFilter && (
                <button
                  type="button"
                  onClick={() => setStarFilter(null)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <X className="size-3" /> Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Write / edit */}
        {canReview ? (
          formOpen ? (
            <form onSubmit={submit} className="animate-in fade-in slide-in-from-top-2 space-y-3 rounded-2xl border border-border p-6 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold uppercase">
                  {myReview ? "Update your review" : "Write a review"}
                </h3>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  aria-label="Close review form"
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

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
                <p className="text-right text-xs text-muted-foreground">{body.length}/2000</p>
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {myReview ? "Update review" : "Submit review"}
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-border p-6">
              {myReview ? (
                <>
                  <p className="text-sm font-semibold">You reviewed this product</p>
                  <div className="mt-2">
                    <Rating value={myReview.rating} showCount={false} size="sm" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{myReview.body}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Tried this product?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Help other lifters decide — it takes a minute.
                  </p>
                </>
              )}
              <Button
                variant={myReview ? "outline" : "default"}
                onClick={() => setFormOpen(true)}
                className="mt-4 w-full"
              >
                <PenLine className="mr-2 size-4" />
                {myReview ? "Edit your review" : "Write a review"}
              </Button>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
              Sign in
            </Link>{" "}
            to write a review.
          </div>
        )}
      </div>

      {/* ---- Review list ---- */}
      <div className="space-y-4">
        {reviews.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-sm text-muted-foreground">
              {starFilter ? (
                <>
                  Showing <strong className="text-foreground">{visible.length}</strong> {starFilter}-star
                  review{visible.length === 1 ? "" : "s"}
                </>
              ) : (
                <>
                  <strong className="text-foreground">{reviews.length}</strong> review
                  {reviews.length === 1 ? "" : "s"}
                </>
              )}
            </p>

            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <div className="flex rounded-md border border-border p-0.5">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSort(s.value)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      sort === s.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 font-medium">
              {starFilter ? `No ${starFilter}-star reviews yet` : "No written reviews yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {starFilter ? "Try a different rating filter." : "Be the first to share what you thought."}
            </p>
          </div>
        ) : (
          visible.map((r, i) => {
            const isMine = myReview?.id === r.id;
            return (
              <article
                key={r.id}
                style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 rounded-2xl border p-5 duration-500 fill-mode-backwards",
                  "transition-colors hover:border-primary/40",
                  isMine ? "border-primary/60 bg-accent/30" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full font-display font-bold uppercase",
                        avatarTint(r.authorName)
                      )}
                    >
                      {r.authorName.charAt(0)}
                    </span>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {r.authorName}
                        {isMine && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>

                  {r.isVerifiedPurchase && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
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
                  <div className="mt-4 rounded-lg border-l-2 border-primary bg-muted/50 p-3.5 text-sm">
                    <p className="font-medium">5XL replied</p>
                    <p className="mt-0.5 text-muted-foreground">{r.reply.body}</p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
