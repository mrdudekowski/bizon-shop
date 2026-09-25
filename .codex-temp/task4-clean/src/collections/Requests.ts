import type { CollectionConfig } from "payload";

import {
  requestsCreateAccess,
  requestsDeleteAccess,
  requestsReadAccess,
  requestsUpdateAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  CLIENT_TYPES,
  NOTIFICATION_STATUSES,
  PREFERRED_CONTACT_METHODS,
  REQUEST_STATUSES,
  SOURCE_FORMS,
  priceFieldsRow,
} from "@/collections/fields";
import { hydrateRequestItems } from "@/payload/hooks/hydrateRequestItems";

export const Requests: CollectionConfig = {
  slug: "requests",
  labels: {
    singular: "Заявка",
    plural: "Заявки",
  },
  admin: {
    group: ADMIN_GROUPS.sales,
    useAsTitle: "name",
    defaultColumns: ["name", "phone", "sourceForm", "status", "notificationStatus", "createdAt"],
  },
  access: {
    read: requestsReadAccess,
    create: requestsCreateAccess,
    update: requestsUpdateAccess,
    delete: requestsDeleteAccess,
  },
  hooks: {
    beforeChange: [hydrateRequestItems],
  },
  timestamps: true,
  fields: [
    {
      name: "clientType",
      type: "select",
      label: "Тип клиента",
      options: [...CLIENT_TYPES],
      defaultValue: "individual",
    },
    {
      name: "name",
      type: "text",
      label: "Имя",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
    },
    {
      name: "email",
      type: "email",
      label: "Email",
    },
    {
      name: "city",
      type: "text",
      label: "Город",
    },
    {
      name: "companyName",
      type: "text",
      label: "Компания",
      admin: {
        condition: (_, siblingData) => siblingData?.clientType === "company",
      },
    },
    {
      name: "inn",
      type: "text",
      label: "ИНН",
      admin: {
        condition: (_, siblingData) => siblingData?.clientType === "company",
      },
    },
    {
      name: "position",
      type: "text",
      label: "Должность",
      admin: {
        condition: (_, siblingData) => siblingData?.clientType === "company",
      },
    },
    {
      name: "purchaseVolume",
      type: "text",
      label: "Объём закупки",
    },
    {
      name: "preferredContact",
      type: "select",
      label: "Предпочитаемый способ связи",
      options: [...PREFERRED_CONTACT_METHODS],
    },
    {
      name: "message",
      type: "textarea",
      label: "Сообщение",
    },
    {
      name: "items",
      type: "array",
      label: "Позиции заявки",
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: "catalogItem",
          type: "relationship",
          relationTo: ["tire-models", "wheel-models", "products"],
          label: "Модель / товар",
        },
        {
          name: "catalogVariant",
          type: "relationship",
          relationTo: ["tire-variants", "wheel-variants"],
          label: "Размер / вариант",
          admin: {
            condition: (_, siblingData) => {
              const catalogItem = siblingData?.catalogItem;
              if (
                typeof catalogItem === "object" &&
                catalogItem !== null &&
                "relationTo" in catalogItem
              ) {
                const relationTo = (catalogItem as { relationTo: unknown }).relationTo;
                return relationTo === "tire-models" || relationTo === "wheel-models";
              }
              return siblingData?.itemType === "tire" || siblingData?.itemType === "wheel";
            },
          },
        },
        {
          name: "itemType",
          type: "select",
          label: "Тип позиции",
          required: true,
          defaultValue: "shopProduct",
          options: [
            { label: "Шина", value: "tire" },
            { label: "Диск", value: "wheel" },
            { label: "Товар магазина", value: "shopProduct" },
          ],
          admin: { readOnly: true },
        },
        {
          name: "itemName",
          type: "text",
          label: "Название",
          required: true,
          admin: {
            description: "Заполняется автоматически при выборе модели / товара",
          },
        },
        {
          name: "itemSlug",
          type: "text",
          label: "Slug",
          admin: { hidden: true },
        },
        {
          name: "parentSlug",
          type: "text",
          label: "Slug типа / категории",
          admin: { hidden: true },
        },
        {
          name: "variantLabel",
          type: "text",
          label: "Размер / комплектация",
          admin: { hidden: true },
        },
        {
          name: "quantity",
          type: "number",
          label: "Количество",
          defaultValue: 1,
        },
        {
          name: "url",
          type: "text",
          label: "URL",
        },
        {
          name: "notes",
          type: "text",
          label: "Примечание",
        },
        priceFieldsRow(),
      ],
    },
    {
      name: "sourcePage",
      type: "text",
      label: "Страница источника",
    },
    {
      name: "sourceForm",
      type: "select",
      label: "Форма источника",
      options: [...SOURCE_FORMS],
    },
    {
      type: "row",
      fields: [
        { name: "utmSource", type: "text", label: "UTM Source" },
        { name: "utmMedium", type: "text", label: "UTM Medium" },
        { name: "utmCampaign", type: "text", label: "UTM Campaign" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "utmContent", type: "text", label: "UTM Content" },
        { name: "utmTerm", type: "text", label: "UTM Term" },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Статус обработки",
      required: true,
      defaultValue: "new",
      options: [...REQUEST_STATUSES],
      admin: { position: "sidebar" },
    },
    {
      name: "notificationStatus",
      type: "select",
      label: "Статус уведомлений",
      defaultValue: "pending",
      options: [...NOTIFICATION_STATUSES],
      admin: { position: "sidebar", readOnly: true },
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        {
          name: "telegramSentAt",
          type: "date",
          label: "Telegram отправлен",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
        {
          name: "telegramMessageId",
          type: "text",
          label: "Telegram message ID",
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: "telegramError",
      type: "textarea",
      label: "Telegram error",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        {
          name: "emailSentAt",
          type: "date",
          label: "Email отправлен",
          admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } },
        },
      ],
    },
    {
      name: "emailError",
      type: "textarea",
      label: "Email error",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "sourceIpHash",
      type: "text",
      label: "Source IP hash",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "userAgent",
      type: "text",
      label: "User-Agent",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "assignedTo",
      type: "relationship",
      relationTo: "users",
      label: "Ответственный",
      admin: { position: "sidebar" },
    },
  ],
};
