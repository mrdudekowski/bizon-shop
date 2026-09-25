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

export const TireTypes: CollectionConfig = {
  slug: "tire-types",
  labels: {
    singular: "Тип шин",
    plural: "Типы шин",
  },
  admin: {
    group: ADMIN_GROUPS.tireCatalog,
    useAsTitle: "name",
    defaultColumns: ["name", "sortOrder", "showInMenu", "status"],
    description:
      "Технические группы шин: TBR, OTR и т.д. Определяют разделы каталога /models/{slug}. Не путать с категориями магазина.",
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
        description: "Например: TBR — грузовые шины",
      },
    },
    slugField(),
    {
      name: "description",
      type: "textarea",
      label: "Описание",
      admin: {
        description: "Текст для страницы списка моделей этого типа",
      },
    },
    {
      name: "shortDescription",
      type: "textarea",
      label: "Краткое описание",
      admin: {
        description: "Для карточек на главной и в меню",
      },
    },
    mainImageField({ name: "coverImage", label: "Обложка" }),
    {
      name: "showInMenu",
      type: "checkbox",
      label: "Показывать в меню",
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
