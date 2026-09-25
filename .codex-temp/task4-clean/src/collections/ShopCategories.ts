import type { CollectionConfig } from "payload";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  mainImageField,
  publishedAtField,
  seoFields,
  slugField,
  statusField,
} from "@/collections/fields";
import { catalogContentHooks } from "@/payload/hooks/catalogContentHooks";

export const ShopCategories: CollectionConfig = {
  slug: "shop-categories",
  labels: {
    singular: "Категория магазина",
    plural: "Категории магазина",
  },
  admin: {
    group: ADMIN_GROUPS.catalog,
    useAsTitle: "name",
    defaultColumns: ["name", "showInMenu", "sortOrder", "status"],
  },
  access: {
    read: catalogReadAccess,
    create: catalogWriteAccess,
    update: catalogWriteAccess,
    delete: catalogDeleteAccess,
  },
  hooks: catalogContentHooks,
  fields: [
    {
      name: "name",
      type: "text",
      label: "Название",
      required: true,
    },
    slugField(),
    {
      name: "parentCategory",
      type: "relationship",
      relationTo: "shop-categories",
      label: "Родительская категория",
    },
    {
      name: "description",
      type: "textarea",
      label: "Описание",
    },
    mainImageField({ name: "coverImage", label: "Обложка" }),
    {
      name: "showInMenu",
      type: "checkbox",
      label: "Показывать в меню",
      defaultValue: true,
    },
    {
      name: "showOnShopHome",
      type: "checkbox",
      label: "Показывать на главной магазина",
      defaultValue: true,
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок сортировки",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    seoFields,
    statusField(),
    publishedAtField(),
  ],
};
