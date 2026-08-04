import { NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api-guard";
import { orderStatusSchema } from "@/lib/validators/admin";
import { updateOrderStatus } from "@/server/services/admin.service";

/** PATCH /api/admin/orders/[id] — update an order's fulfilment status. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission("orders:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = orderStatusSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status." },
      { status: 422 }
    );
  }

  const actor = guard.user.name ?? guard.user.email ?? "staff";
  const updated = await updateOrderStatus(id, parsed.data.status, parsed.data.note, actor);
  if (!updated) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  return NextResponse.json({ order: updated });
}
