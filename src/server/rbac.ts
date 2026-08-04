/**
 * Role-based access control map. A single source of truth for roles and the
 * coarse permissions each holds. Fine-grained checks live in services.
 */
export const ROLES = [
  "customer",
  "support_executive",
  "inventory_manager",
  "marketing_manager",
  "super_admin",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that may access the /admin portal at all. */
export const STAFF_ROLES: Role[] = [
  "support_executive",
  "inventory_manager",
  "marketing_manager",
  "super_admin",
];

export type Permission =
  | "products:read"
  | "products:write"
  | "products:delete"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "customers:read"
  | "customers:write"
  | "coupons:write"
  | "cms:write"
  | "reports:read"
  | "settings:write"
  | "roles:write";

const ALL: Permission[] = [
  "products:read",
  "products:write",
  "products:delete",
  "inventory:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "coupons:write",
  "cms:write",
  "reports:read",
  "settings:write",
  "roles:write",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  customer: [],
  support_executive: ["customers:read", "orders:read"],
  inventory_manager: [
    "products:read",
    "products:write",
    "inventory:write",
    "orders:read",
  ],
  marketing_manager: ["products:read", "coupons:write", "cms:write"],
  super_admin: ALL,
};

export function hasPermission(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function isStaff(role: Role | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
