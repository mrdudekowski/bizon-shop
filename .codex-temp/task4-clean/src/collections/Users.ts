import type { CollectionConfig } from "payload";
import { APIError } from "payload";

import {
  USER_ROLES,
  USER_STATUSES,
  canAccessAdminPanel,
  canReadUsers,
  canUpdateUsers,
  isAdmin,
  isAdminFieldLevel,
} from "@/access/roles";
import { ADMIN_GROUPS } from "@/collections/fields/constants";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "role", "status"],
    group: ADMIN_GROUPS.settings,
  },
  access: {
    admin: canAccessAdminPanel,
    create: isAdmin,
    read: canReadUsers,
    update: canUpdateUsers,
    delete: isAdmin,
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user && user.status === "inactive") {
          throw new APIError("Account is inactive. Contact an administrator.", 403);
        }
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    },
    {
      name: "role",
      type: "select",
      label: "Role",
      required: true,
      defaultValue: "viewer",
      options: USER_ROLES.map((role) => ({
        label: role
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        value: role,
      })),
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      validate: (value) => {
        if (!value || !USER_ROLES.includes(value as (typeof USER_ROLES)[number])) {
          return "Invalid role";
        }
        return true;
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      validate: (value) => {
        if (!value || !USER_STATUSES.includes(value as (typeof USER_STATUSES)[number])) {
          return "Invalid status";
        }
        return true;
      },
    },
  ],
  timestamps: true,
};
