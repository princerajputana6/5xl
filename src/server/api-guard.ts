import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasPermission, isStaff, type Permission, type Role } from "@/server/rbac";

type Guarded =
  | { ok: true; user: { id: string; role: Role; name?: string | null; email?: string | null } }
  | { ok: false; response: NextResponse };

/**
 * Route-handler guard: ensures the caller is staff and holds `perm`.
 * Returns either the user or a ready-to-send 401/403 response.
 */
export async function requireApiPermission(perm: Permission): Promise<Guarded> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }
  if (!isStaff(user.role as Role) || !hasPermission(user.role as Role, perm)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 }),
    };
  }
  return {
    ok: true,
    user: { id: user.id, role: user.role as Role, name: user.name, email: user.email },
  };
}
