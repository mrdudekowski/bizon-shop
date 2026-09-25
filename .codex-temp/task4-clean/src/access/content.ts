import type { Access } from "payload";

import {
  canManageContent,
  canManageRequests,
  hasRole,
  isActiveUser,
  isAdmin,
  type BizonUser,
} from "@/access/roles";

/** Public site: only published; staff sees all */
export const canReadPublishedContent: Access = ({ req: { user } }) => {
  if (
    isActiveUser(user as BizonUser | undefined) &&
    hasRole(user as BizonUser | undefined, [
      "admin",
      "content_manager",
      "viewer",
      "sales_manager",
    ])
  ) {
    return true;
  }

  return { status: { equals: "published" } };
};

export const catalogReadAccess = canReadPublishedContent;
export const catalogWriteAccess = canManageContent;
export const catalogDeleteAccess = isAdmin;

export const mediaReadAccess: Access = ({ req: { user } }) => {
  if (isActiveUser(user as BizonUser | undefined)) {
    return true;
  }

  return { status: { equals: "published" } };
};

export const mediaWriteAccess = canManageContent;

export const requestsReadAccess: Access = ({ req: { user } }) => {
  if (!isActiveUser(user as BizonUser | undefined)) return false;

  return hasRole(user as BizonUser | undefined, ["admin", "sales_manager", "viewer"]);
};

export const requestsCreateAccess: Access = () => true;

export const requestsUpdateAccess = canManageRequests;
export const requestsDeleteAccess = isAdmin;
