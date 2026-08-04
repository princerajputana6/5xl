import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff, hasPermission, type Permission, type Role } from "@/server/rbac";

/** Current session user or null (Server Components / route handlers). */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Require any logged-in user; redirects to /login otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a staff role; redirects non-staff to the storefront. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isStaff(user.role as Role)) redirect("/");
  return user;
}

/** Require a specific permission; redirects if lacking it. */
export async function requirePermission(perm: Permission) {
  const user = await requireStaff();
  if (!hasPermission(user.role as Role, perm)) redirect("/admin");
  return user;
}
