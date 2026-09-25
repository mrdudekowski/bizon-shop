import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import {
  catalogDeleteAccess,
  catalogReadAccess,
  catalogWriteAccess,
} from "@/access/content";
import {
  ADMIN_GROUPS,
  galleryField,
  mainImageField,
  publishedAtField,
  seoFields,
  slugField,
  statusField,
} from "@/collections/fields";
import { catalogContentHooks } from "@/payload/hooks/catalogContentHooks";

export const PeopleStories: CollectionConfig = {
  slug: "people-stories",
  labels: {
    singular: "История клиента",
    plural: "People Stories",
  },
  admin: {
    group: ADMIN_GROUPS.content,
    useAsTitle: "title",
    defaultColumns: ["title", "clientName", "status", "publishedAt"],
    description: "Кейсы клиентов для раздела /people-stories.",
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
      name: "title",
      type: "text",
      label: "Заголовок",
      required: true,
    },
    slugField({ fieldToUse: "title" }),
    {
      name: "excerpt",
      type: "textarea",
      label: "Краткое описание",
    },
    {
      name: "content",
      type: "richText",
      label: "Текст истории",
      required: true,
      editor: lexicalEditor(),
    },
    mainImageField({ name: "featuredImage", label: "Обложка" }),
    galleryField(),
    {
      type: "row",
      fields: [
        {
          name: "clientName",
          type: "text",
          label: "Клиент / автопарк",
        },
        {
          name: "industry",
          type: "text",
          label: "Отрасль",
        },
      ],
    },
    seoFields,
    statusField(),
    publishedAtField(),
  ],
};
