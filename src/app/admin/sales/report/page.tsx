import { requirePermission } from "@/lib/session";
import { getSalesReport } from "@/server/services/analytics.service";
import { RANGES, type RangeKey } from "@/lib/analytics";
import { formatINR, formatDate } from "@/lib/format";
import { PrintTrigger } from "@/components/admin/print-trigger";

export const metadata = { title: "Sales report" };

/**
 * Print-optimised sales report. Opened in a new tab from the dashboard, where
 * the browser's own print dialog turns it into a PDF ("Save as PDF") — no
 * extra dependency, and the output matches what's on screen.
 */
export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePermission("reports:read");

  const { range } = await searchParams;
  const key: RangeKey = RANGES.includes(range as RangeKey) ? (range as RangeKey) : "month";
  const report = await getSalesReport(key);
  const { totals } = report;

  return (
    <>
      <PrintTrigger />

      <div className="mx-auto max-w-4xl bg-white p-5 text-black sm:p-10 print:p-0">
        {/* Masthead */}
        <header className="flex flex-col gap-3 border-b-4 border-black pb-4 sm:flex-row sm:items-start sm:justify-between print:flex-row print:items-start print:justify-between">
          <div>
            <p className="text-2xl font-extrabold uppercase tracking-tight">5XL Nutrition</p>
            <p className="text-sm text-neutral-600">Sales &amp; analytics report</p>
          </div>
          <div className="text-sm sm:text-right print:text-right">
            <p className="font-semibold">{report.rangeLabel}</p>
            <p className="text-neutral-600">
              {report.from ? `${formatDate(report.from)} — ` : "Up to "}
              {formatDate(report.to)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Generated {formatDate(new Date().toISOString())}
            </p>
          </div>
        </header>

        {/* Headline numbers */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Summary</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
            {[
              { label: "Revenue", value: formatINR(totals.revenue) },
              { label: "Orders", value: String(totals.orders) },
              { label: "Units sold", value: String(totals.units) },
              { label: "Avg order value", value: formatINR(totals.avgOrderValue) },
            ].map((s) => (
              <div key={s.label} className="border border-neutral-300 p-3">
                <p className="text-[0.7rem] uppercase text-neutral-600">{s.label}</p>
                <p className="mt-0.5 text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3">
            {[
              { label: "Discounts given", value: formatINR(totals.discountGiven) },
              { label: "Shipping collected", value: formatINR(totals.shippingCollected) },
              { label: "New customers", value: String(totals.newCustomers) },
            ].map((s) => (
              <div key={s.label} className="border border-neutral-300 p-3">
                <p className="text-[0.7rem] uppercase text-neutral-600">{s.label}</p>
                <p className="mt-0.5 text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trend table — a table prints more reliably than a chart */}
        {report.trend.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Revenue by period</h2>
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1.5">Period</th>
                  <th className="py-1.5 text-right">Orders</th>
                  <th className="py-1.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.trend.map((t) => (
                  <tr key={t.label} className="border-b border-neutral-200">
                    <td className="py-1.5">{t.label}</td>
                    <td className="py-1.5 text-right">{t.orders}</td>
                    <td className="py-1.5 text-right">{formatINR(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {/* Top products */}
        {report.topProducts.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Top products</h2>
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1.5">#</th>
                  <th className="py-1.5">Product</th>
                  <th className="py-1.5 text-right">Units</th>
                  <th className="py-1.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={p.slug} className="border-b border-neutral-200">
                    <td className="py-1.5">{i + 1}</td>
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5 text-right">{p.units}</td>
                    <td className="py-1.5 text-right">{formatINR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {/* Status mix */}
        {report.statusBreakdown.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Order status mix</h2>
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1.5">Status</th>
                  <th className="py-1.5 text-right">Orders</th>
                  <th className="py-1.5 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {report.statusBreakdown.map((s) => (
                  <tr key={s.status} className="border-b border-neutral-200">
                    <td className="py-1.5 capitalize">{s.status}</td>
                    <td className="py-1.5 text-right">{s.count}</td>
                    <td className="py-1.5 text-right">{formatINR(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        {/* Coupons */}
        {report.coupons.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Coupon performance</h2>
            <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1.5">Code</th>
                  <th className="py-1.5 text-right">Uses</th>
                  <th className="py-1.5 text-right">Discount given</th>
                </tr>
              </thead>
              <tbody>
                {report.coupons.map((c) => (
                  <tr key={c.code} className="border-b border-neutral-200">
                    <td className="py-1.5 font-mono">{c.code}</td>
                    <td className="py-1.5 text-right">{c.uses}</td>
                    <td className="py-1.5 text-right">{formatINR(c.discount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        )}

        <footer className="mt-10 border-t border-neutral-300 pt-3 text-xs text-neutral-500">
          Figures cover paid orders only. Order status mix includes every order placed in the
          period, regardless of payment state.
        </footer>
      </div>
    </>
  );
}
