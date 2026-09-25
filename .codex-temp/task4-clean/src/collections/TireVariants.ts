import type { CollectionConfig } from "payload";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  publishedAtField,
  statusField,
  tireCommercialFields,
  tireVariantIdentityFields,
  tireVariantTechnicalFields,
} from "@/collections/fields";
import { normalizeTireVariant } from "@/payload/hooks/normalizeTireCatalog";
import { validateTireVariantPublication } from "@/payload/hooks/validateTirePublication";
import { setPublishedAt } from "@/payload/hooks/setPublishedAt";
import {
  revalidateSiteCache,
  revalidateSiteCacheAfterDelete,
} from "@/payload/hooks/revalidateSiteCache";

const variantTechnicalFields = tireVariantTechnicalFields();
const variantSizeFields = variantTechnicalFields.slice(0, 5);
const variantSpecificationFields = variantTechnicalFields.slice(5);

export const TireVariants: CollectionConfig = {
  slug: "tire-variants",
  labels: {
    singular: "Размер и характеристики",
    plural: "Размеры и характеристики шин",
  },
  admin: {
    group: ADMIN_GROUPS.tireCatalog,
    useAsTitle: "sizeNormalized",
    defaultColumns: [
      "sku",
      "sizeNormalized",
      "tireModel",
      "availabilityStatus",
      "price",
      "status",
    ],
    description: "Размеры и технические параметры конкретной модели шины.",
  },
  access: {
    read: catalogReadAccess,
    create: catalogWriteAccess,
    update: catalogWriteAccess,
    delete: catalogDeleteAccess,
  },
  hooks: {
    beforeValidate: [normalizeTireVariant],
    beforeChange: [validateTireVariantPublication, setPublishedAt],
    afterChange: [revalidateSiteCache],
    afterDelete: [revalidateSiteCacheAfterDelete],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Размер",
          fields: [
            {
              name: "tireModel",
              type: "relationship",
              relationTo: "tire-models",
              label: "Модель шины",
              required: true,
            },
            ...tireVariantIdentityFields(),
            ...variantSizeFields,
          ],
        },
        {
          label: "Технические",
          fields: [...variantSpecificationFields],
        },
        {
          label: "Коммерческие",
          fields: [...tireCommercialFields()],
        },
      ],
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок в таблице",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    statusField(),
    publishedAtField(),
  ],
};
