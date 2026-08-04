import type { Metadata } from "next";
import { requireStaff } from "@/lib/session";
import { ROLE_PERMISSIONS, type Role } from "@/server/rbac";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin · 5XL", template: "%s · 5XL Admin" },
};

const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  support_executive: "Support",
  inventory_manager: "Inventory Manager",
  marketing_manager: "Marketing Manager",
  super_admin: "Super Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff(); // redirects non-staff
  const role = user.role as Role;

  return (
    <AdminShell
      permissions={ROLE_PERMISSIONS[role] ?? []}
      roleLabel={ROLE_LABELS[role] ?? role}
      userName={user.name ?? user.email ?? "Staff"}
    >
      {children}
    </AdminShell>
  );
}
