import type { Access, FieldAccess } from "payload";

export const USER_ROLES = [
  "admin",
  "content_manager",
  "sales_manager",
  "viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "inactive"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export type BizonUser = {
  id: string | number;
  role?: UserRole | null;
  status?: UserStatus | null;
};

export function getUserRole(user: BizonUser | null | undefined): UserRole | null {
  return user?.role ?? null;
}

export function isActiveUser(user: BizonUser | null | undefined): boolean {
  return Boolean(user && (user.status ?? "active") === "active");
}

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const isActiveAuthenticated: Access = ({ req: { user } }) =>
  isActiveUser(user as BizonUser | undefined);

export const isAdmin: Access = ({ req: { user } }) =>
  getUserRole(user as BizonUser | undefined) === "admin";

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) =>
  getUserRole(user as BizonUser | undefined) === "admin";

export const canReadUsers: Access = ({ req: { user } }) => {
  if (!isActiveUser(user as BizonUser | undefined)) return false;
  if (getUserRole(user as BizonUser | undefined) === "admin") return true;
  if (user?.id) return { id: { equals: user.id } };
  return false;
};

export const canUpdateUsers: Access = ({ req: { user } }) => {
  if (!isActiveUser(user as BizonUser | undefined)) return false;
  if (getUserRole(user as BizonUser | undefined) === "admin") return true;
  if (user?.id) return { id: { equals: user.id } };
  return false;
};

/** Admin panel entry — active staff roles only */
export function canAccessAdminPanel({ req: { user } }: { req: { user: unknown } }): boolean {
  const role = getUserRole(user as BizonUser | undefined);
  return isActiveUser(user as BizonUser | undefined) && Boolean(role && USER_ROLES.includes(role));
}

/** Content & catalog collections (Prompt 04+) */
export const canManageContent: Access = ({ req: { user } }) => {
  const role = getUserRole(user as BizonUser | undefined);
  return isActiveUser(user as BizonUser | undefined) &&
    (role === "admin" || role === "content_manager");
};

/** Requests / sales (Prompt 07+) */
export const canManageRequests: Access = ({ req: { user } }) => {
  const role = getUserRole(user as BizonUser | undefined);
  return isActiveUser(user as BizonUser | undefined) &&
    (role === "admin" || role === "sales_manager");
};

export function hasRole(
  user: BizonUser | null | undefined,
  roles: UserRole[],
): boolean {
  const role = getUserRole(user);
  return Boolean(role && roles.includes(role));
}
