import type { CollectionConfig } from "payload";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import { ADMIN_GROUPS, priceFieldsRow, publishedAtField, statusField } from "@/collections/fields";
import { catalogContentHooks } from "@/payload/hooks/catalogContentHooks";

export const WheelVariants: CollectionConfig = {
  slug: "wheel-variants",
  labels: {
    singular: "Размер и параметры",
    plural: "Размеры и параметры дисков",
  },
  admin: {
    group: ADMIN_GROUPS.wheelCatalog,
    useAsTitle: "sizeLabel",
    defaultColumns: ["sizeLabel", "wheelModel", "diameter", "pcd", "available", "sortOrder", "status"],
    description: "Посадочные параметры и SKU конкретного размера диска.",
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
      name: "wheelModel",
      type: "relationship",
      relationTo: "wheel-models",
      label: "Модель диска",
      required: true,
    },
    {
      name: "sizeLabel",
      type: "text",
      label: "Размер (отображение)",
      required: true,
      admin: {
        description: "Например: 22.5×8.25 · 10×335 · ET+120",
      },
    },
    {
      name: "sku",
      type: "text",
      label: "Артикул",
      admin: {
        description: "Внутренний код для склада и заявок",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "diameter",
          type: "number",
          label: "Диаметр (дюймы)",
          admin: { description: "Например: 22.5" },
        },
        {
          name: "width",
          type: "number",
          label: "Ширина (дюймы)",
          admin: { description: "Например: 8.25" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "boltHoles",
          type: "number",
          label: "Кол-во отверстий",
        },
        {
          name: "pcd",
          type: "text",
          label: "Разболтовка (PCD)",
          admin: { description: "Диаметр окружности, мм — например: 335" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "offsetET",
          type: "number",
          label: "Вылет (ET)",
          admin: { description: "мм, со знаком" },
        },
        {
          name: "centerBore",
          type: "number",
          label: "Центральное отверстие (DIA)",
          admin: { description: "мм" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "loadRating",
          type: "text",
          label: "Допустимая нагрузка",
        },
        {
          name: "weight",
          type: "number",
          label: "Масса (кг)",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "color",
          type: "text",
          label: "Цвет",
        },
        {
          name: "finish",
          type: "text",
          label: "Покрытие / отделка",
        },
      ],
    },
    {
      name: "compatibleTireSizes",
      type: "textarea",
      label: "Совместимые размеры шин",
      admin: {
        description: "Через запятую или с новой строки — например: 11R22.5, 315/80R22.5",
      },
    },
    {
      name: "available",
      type: "checkbox",
      label: "Доступен",
      defaultValue: true,
    },
    priceFieldsRow(),
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
