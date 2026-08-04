import { requirePermission } from "@/lib/session";
import { listCoupons } from "@/server/services/coupon.service";
import { CouponsClient } from "@/components/admin/coupons-client";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await requirePermission("coupons:write");
  const coupons = await listCoupons();
  return <CouponsClient coupons={coupons} />;
}
