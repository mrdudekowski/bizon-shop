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
  publishedAtField,
  seoFields,
  slugField,
  statusField,
  tireModelFeaturesField,
  tireModelTaxonomyFields,
} from "@/collections/fields";
import { normalizeTireModel } from "@/payload/hooks/normalizeTireCatalog";
import { validateTireModelPublication } from "@/payload/hooks/validateTirePublication";
import { setPublishedAt } from "@/payload/hooks/setPublishedAt";
import {
  revalidateSiteCache,
  revalidateSiteCacheAfterDelete,
} from "@/payload/hooks/revalidateSiteCache";
export const TireModels: CollectionConfig = {
  slug: "tire-models",
  labels: {
    singular: "Модель шины",
    plural: "Модели шин",
  },
  admin: {
    group: ADMIN_GROUPS.tireCatalog,
    useAsTitle: "name",
    defaultColumns: ["name", "modelCode", "tireType", "status", "updatedAt"],
    description:
      "Модель шины: карточка для сайта, характеристики и размеры.",
  },
  access: {
    read: catalogReadAccess,
    create: catalogWriteAccess,
    update: catalogWriteAccess,
    delete: catalogDeleteAccess,
  },
  hooks: {
    beforeValidate: [normalizeTireModel],
    beforeChange: [validateTireModelPublication, setPublishedAt],
    afterChange: [revalidateSiteCache],
    afterDelete: [revalidateSiteCacheAfterDelete],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Основное",
          fields: [
            {
              name: "name",
              type: "text",
              label: "Название модели",
              required: true,
            },
            slugField(),
            {
              name: "modelCode",
              type: "text",
              label: "Код модели",
              unique: true,
              index: true,
              admin: {
                description:
                  "Опционально. Если пусто — заполнится из slug при сохранении.",
              },
            },
            {
              name: "tireType",
              type: "relationship",
              relationTo: "tire-types",
              label: "Тип шин",
              required: true,
              admin: {
                description:
                  "TBR, OTR, Agriculture и т.д. — техническая группа каталога",
              },
            },
            ...tireModelTaxonomyFields(),
          ],
        },
        {
          label: "Преимущества",
          fields: [tireModelFeaturesField()],
        },
        {
          label: "Размеры",
          fields: [
            {
              name: "variants",
              type: "join",
              label: "Размеры и характеристики",
              collection: "tire-variants",
              on: "tireModel",
              admin: {
                description:
                  "Добавляйте размеры здесь. SKU создаётся автоматически.",
                defaultColumns: [
                  "sku",
                  "sizeNormalized",
                  "availabilityStatus",
                  "price",
                  "status",
                ],
              },
            },
          ],
        },
        {
          label: "Контент и медиа",
          fields: [
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
          ],
        },
      ],
    },
    statusField(),
    publishedAtField(),
  ],
};
