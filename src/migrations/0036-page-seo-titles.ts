import type { Migration } from "../migrationRunner";

const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

/** Search titles without the site name. The public site appends " | Bizon Tires". */
const SEO_TITLES: readonly (readonly [string, string])[] = [
  ["warranty", "Гарантия и возврат"],
  ["delivery", "Доставка"],
  ["payment", "Оплата"],
  ["shop-delivery", "Доставка"],
  ["shop-payment", "Оплата"],
  ["shop-warranty", "Гарантия и возврат"],
  ["shop-become-a-supplier", "Стать поставщиком"],
  ["branding", "Брендирование шин для спецтехники"],
];

const pageUpdates = SEO_TITLES.map(
  ([key, title]) => `
    UPDATE pages
    SET seo_seo_title = ${sqlLiteral(title)}, updated_at = now()
    WHERE key = ${sqlLiteral(key)};`,
).join("\n");

const draftUpdates = SEO_TITLES.map(
  ([key, title]) => `
    UPDATE cms_drafts
    SET draft = jsonb_set(draft, '{seoTitle}', to_jsonb(${sqlLiteral(title)}::text), true)
    WHERE collection = 'pages' AND doc_id = ${sqlLiteral(key)} AND jsonb_typeof(draft) = 'object';`,
).join("\n");

export const pageSeoTitlesMigration: Migration = {
  version: "202610300036",
  description: "Set search titles to the page names, without a second brand",
  sql: `${pageUpdates}\n${draftUpdates}`,
};
