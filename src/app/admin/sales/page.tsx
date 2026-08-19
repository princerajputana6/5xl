import { requirePermission } from "@/lib/session";
import { getSalesReport } from "@/server/services/analytics.service";
import { RANGES, type RangeKey } from "@/lib/analytics";
import { SalesDashboard } from "@/components/admin/sales-dashboard";

export const metadata = { title: "Sales & Analytics" };

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePermission("reports:read");

  const { range } = await searchParams;
  const key: RangeKey = RANGES.includes(range as RangeKey) ? (range as RangeKey) : "month";
  const report = await getSalesReport(key);

  return <SalesDashboard report={report} />;
}
