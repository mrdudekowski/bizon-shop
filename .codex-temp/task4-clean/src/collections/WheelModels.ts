import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  WHEEL_CONSTRUCTION_METHODS,
  documentsField,
  galleryField,
  mainImageField,
  publishedAtField,
  seoFields,
  slugField,
  statusField,
} from "@/collections/fields";
import { catalogContentHooks } from "@/payload/hooks/catalogContentHooks";

export const WheelModels: CollectionConfig = {
  slug: "wheel-models",
  labels: {
    singular: "Модель диска",
    plural: "Модели дисков",
  },
  admin: {
    group: ADMIN_GROUPS.wheelCatalog,
    useAsTitle: "name",
    defaultColumns: ["name", "wheelType", "status", "updatedAt"],
    description:
      "Дизайн / линейка дисков. Тип (кованые/литые) — через «Тип дисков». Размеры — в «Размеры и параметры».",
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
      label: "Название модели",
      required: true,
    },
    slugField(),
    {
      name: "wheelType",
      type: "relationship",
      relationTo: "wheel-types",
      label: "Тип дисков",
      required: true,
      admin: {
        description: "Кованые, литые и т.д. — техническая группа каталога",
      },
    },
    {
      name: "series",
      type: "text",
      label: "Серия",
    },
    {
      name: "designStyle",
      type: "text",
      label: "Стиль / дизайн",
      admin: {
        description: "Маркетинговое название дизайна",
      },
    },
    {
      name: "material",
      type: "text",
      label: "Материал",
      admin: {
        description: "Например: кованый алюминий",
      },
    },
    {
      name: "constructionMethod",
      type: "select",
      label: "Способ изготовления",
      options: [...WHEEL_CONSTRUCTION_METHODS],
      admin: {
        description: "Должен соответствовать типу дисков",
      },
    },
    {
      name: "fitmentNotes",
      type: "textarea",
      label: "Примечания по установке",
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
    mainImageField(),
    galleryField(),
    documentsField(),
    seoFields,
    statusField(),
    publishedAtField(),
  ],
};
