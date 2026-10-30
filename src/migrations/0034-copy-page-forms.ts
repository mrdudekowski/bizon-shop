import type { Migration } from "../migrationRunner";

/** The database cannot import TypeScript, so the warranty default is inlined. */
const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

/**
 * Warranty has no seeded page_forms row; the public form is this default until a manager saves one.
 * ponytail: copied only when that row is still absent. An editor-saved warranty form is copied instead.
 */
const WARRANTY_DEFAULT_SUCCESS =
  "Спасибо! Обращение получено. Мы свяжемся с вами по гарантии и возврату.";

const WARRANTY_DEFAULT_FIELDS: readonly (readonly [string, string, string, boolean])[] = [
  ["name", "Имя", "text", true],
  ["phone", "Телефон", "tel", true],
  ["email", "Email", "email", false],
  ["problem", "Опишите проблему", "textarea", true],
];

const warrantyDefaultFieldRows = WARRANTY_DEFAULT_FIELDS.map(
  ([id, label, type, required], index) =>
    `('shop-warranty'::text, ${sqlLiteral(id)}::text, ${index}::int, ${sqlLiteral(label)}::text, ${sqlLiteral(type)}::text, ${required}::boolean)`,
).join(",\n        ");

/** Each target gets its own page_forms row and its own field rows. The source rows stay. */
function copyForm(target: string, source: string): string {
  return `
    INSERT INTO page_forms (page_key, success_message)
    SELECT '${target}', success_message
    FROM page_forms
    WHERE page_key = '${source}'
    ON CONFLICT (page_key) DO NOTHING;

    INSERT INTO page_form_fields (page_key, id, sort_order, label, field_type, required)
    SELECT '${target}', id, sort_order, label, field_type, required
    FROM page_form_fields
    WHERE page_key = '${source}'
    ON CONFLICT (page_key, id) DO NOTHING;
  `;
}

export const copyPageFormsMigration: Migration = {
  version: "202610300034",
  description: "Copy delivery, warranty, and supplier forms onto the new page keys",
  sql: `
    ${copyForm("delivery", "delivery-geography")}
    ${copyForm("shop-delivery", "delivery-geography")}
    ${copyForm("shop-warranty", "warranty")}

    INSERT INTO page_forms (page_key, success_message)
    SELECT 'shop-warranty', ${sqlLiteral(WARRANTY_DEFAULT_SUCCESS)}
    WHERE NOT EXISTS (SELECT 1 FROM page_forms WHERE page_key = 'warranty')
      AND NOT EXISTS (SELECT 1 FROM page_forms WHERE page_key = 'shop-warranty')
    ON CONFLICT (page_key) DO NOTHING;

    INSERT INTO page_form_fields (page_key, id, sort_order, label, field_type, required)
    SELECT page_key, id, sort_order, label, field_type, required
    FROM (VALUES
        ${warrantyDefaultFieldRows}
    ) AS seeded(page_key, id, sort_order, label, field_type, required)
    WHERE NOT EXISTS (SELECT 1 FROM page_forms WHERE page_key = 'warranty')
    ON CONFLICT (page_key, id) DO NOTHING;

    ${copyForm("shop-become-a-supplier", "become-a-supplier")}
  `,
};
