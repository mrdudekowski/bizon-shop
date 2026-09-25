import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  documentsField,
  galleryField,
  mainImageField,
  priceFieldsRow,
  publishedAtField,
  seoFields,
  slugField,
  statusField,
} from "@/collections/fields";
import { catalogContentHooks } from "@/payload/hooks/catalogContentHooks";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Товар магазина",
    plural: "Товары магазина",
  },
  admin: {
    group: ADMIN_GROUPS.catalog,
    useAsTitle: "name",
    defaultColumns: ["name", "shopCategory", "status", "updatedAt"],
    description: "BIZON Shop — merch и аксессуары. Шины и диски — в каталоге шин/дисков.",
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
      name: "shopCategory",
      type: "relationship",
      relationTo: "shop-categories",
      label: "Категория магазина",
      required: true,
    },
    {
      name: "shortDescription",
      type: "textarea",
      label: "Краткое описание",
    },
    {
      name: "fullDescription",
      type: "richText",
      label: "Полное описание",
      editor: lexicalEditor(),
    },
    priceFieldsRow(),
    {
      type: "row",
      fields: [
        { name: "color", type: "text", label: "Цвет" },
        { name: "size", type: "text", label: "Размер" },
        { name: "material", type: "text", label: "Материал" },
      ],
    },
    mainImageField(),
    galleryField(),
    documentsField({ name: "instructions", label: "Инструкции" }),
    seoFields,
    statusField(),
    publishedAtField(),
  ],
};
