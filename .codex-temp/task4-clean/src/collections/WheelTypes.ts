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

export const WheelTypes: CollectionConfig = {
  slug: "wheel-types",
  labels: {
    singular: "Тип дисков",
    plural: "Типы дисков",
  },
  admin: {
    group: ADMIN_GROUPS.wheelCatalog,
    useAsTitle: "name",
    defaultColumns: ["name", "sortOrder", "status"],
    description:
      "Технические группы дисков: кованые, литые и т.д. Не путать с категориями магазина (Outdoor, Merch).",
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
      admin: {
        description: "Например: Кованые диски",
      },
    },
    slugField(),
    {
      name: "description",
      type: "textarea",
      label: "Описание",
      admin: {
        description: "Текст для раздела /shop/wheels",
      },
    },
    {
      name: "shortDescription",
      type: "textarea",
      label: "Краткое описание",
      admin: {
        description: "Для карточки на странице магазина",
      },
    },
    mainImageField({ name: "coverImage", label: "Обложка" }),
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
