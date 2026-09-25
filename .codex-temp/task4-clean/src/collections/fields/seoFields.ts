import type { Field } from "payload";

export const seoFields: Field = {
  name: "seo",
  type: "group",
  label: "SEO",
  admin: {
    description: "Мета-теги для публичных страниц. Пустые поля заполняются автоматически на фронтенде.",
  },
  fields: [
    {
      name: "seoTitle",
      type: "text",
      label: "SEO Title",
      maxLength: 70,
    },
    {
      name: "seoDescription",
      type: "textarea",
      label: "SEO Description",
      maxLength: 160,
    },
    {
      name: "seoKeywords",
      type: "text",
      label: "SEO Keywords",
      admin: {
        description: "Через запятую",
      },
    },
    {
      name: "ogTitle",
      type: "text",
      label: "Open Graph Title",
    },
    {
      name: "ogDescription",
      type: "textarea",
      label: "Open Graph Description",
    },
    {
      name: "ogImage",
      type: "upload",
      relationTo: "media",
      label: "Open Graph Image",
    },
    {
      name: "canonicalUrl",
      type: "text",
      label: "Canonical URL",
    },
    {
      name: "robotsIndex",
      type: "checkbox",
      label: "Robots: Index",
      defaultValue: true,
    },
    {
      name: "robotsFollow",
      type: "checkbox",
      label: "Robots: Follow",
      defaultValue: true,
    },
  ],
};
