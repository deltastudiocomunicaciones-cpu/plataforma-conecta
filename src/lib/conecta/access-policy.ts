import type { AccessRole } from "@/lib/supabase/database.types";

export type AccessPermission =
  | "view:own-position"
  | "view:team"
  | "view:all"
  | "create:report"
  | "review:report"
  | "approve:report"
  | "manage:users"
  | "view:sensitive-data"
  // Reserved until a verified Nivelar resource policy is approved (SEC-NIV-01).
  | "view:nivelar-evidence"
  | "manage:catalog";

export const accessRolePermissions: Record<AccessRole, AccessPermission[]> = {
  superadmin: [
    "view:all",
    "create:report",
    "review:report",
    "approve:report",
    "manage:users",
    "view:sensitive-data",
    "manage:catalog",
  ],

  direccion: [
    "view:all",
    "review:report",
    "approve:report",
    "view:sensitive-data",
  ],

  gerencia: [
    "view:team",
    "create:report",
    "review:report",
    "approve:report",
  ],

  responsable: [
    "view:own-position",
    "create:report",
  ],

  cultura_conecta: [
    "view:all",
    "review:report",
    "manage:catalog",
  ],

  lector: [
    "view:own-position",
  ],
};

export function canAccess(
  role: AccessRole,
  permission: AccessPermission,
) {
  return Object.hasOwn(accessRolePermissions, role)
    && accessRolePermissions[role].includes(permission);
}
