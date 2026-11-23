import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { listAllReviews } from "@/server/services/review.service";
import { ReviewsModerationClient } from "@/components/admin/reviews-moderation-client";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reviews" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requirePermission("cms:write");
  const { status = "all", page } = await searchParams;
  const { rows, total, page: current, pages } = await listAllReviews({
    status,
    page: Number(page) || 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">{total} review(s)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/reviews?status=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              status === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ReviewsModerationClient reviews={rows} />

      <Pagination page={current} pages={pages} total={total} />
    </div>
  );
}
