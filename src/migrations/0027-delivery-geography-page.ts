import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import type { Migration } from "../migrationRunner";

/** The database cannot import TypeScript, so the shared sentences are inlined as escaped literals. */
const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

const [geographyLead, ...geographyCalculation] = CUSTOMER_COPY.geography;

/** Delivery-geography form fields in display order: id, label, type, required. */
const GEOGRAPHY_FIELDS: readonly (readonly [string, string, string, boolean])[] = [
  ["name", "Имя или название компании", "text", true],
  ["phone", "Телефон", "tel", true],
  ["email", "Email", "email", false],
  ["region", "Город или регион доставки", "text", true],
  ["product", "Наименование или категория товара", "text", true],
  ["quantity", "Необходимое количество", "text", false],
  ["comment", "Комментарий или дополнительная информация", "textarea", false],
];

const geographyFieldRows = GEOGRAPHY_FIELDS.map(
  ([id, label, type, required], index) =>
    `('delivery-geography', ${sqlLiteral(id)}, ${index}, ${sqlLiteral(label)}, ${sqlLiteral(type)}, ${required})`,
).join(",\n      ");

/** Seeds the page row, its single editorial section, and its request form. Uses the enum value added by 0026. */
export const deliveryGeographyPageMigration: Migration = {
  version: "202610300027",
  description: "Publish the delivery-geography page with its editorial section and request form",
  sql: `
    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'delivery-geography', 'География поставок', 'published', 'География поставок', ${sqlLiteral(geographyLead)},
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'delivery-geography');

    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT 'geography-calculation', p.id, 0, '', ${sqlLiteral(geographyCalculation.join("\n\n"))}
    FROM pages AS p
    WHERE p.key = 'delivery-geography'
    ON CONFLICT (_parent_id, id) DO NOTHING;

    INSERT INTO page_forms (page_key, success_message)
    VALUES ('delivery-geography', ${sqlLiteral(CUSTOMER_COPY.geographySuccess)})
    ON CONFLICT (page_key) DO NOTHING;

    INSERT INTO page_form_fields (page_key, id, sort_order, label, field_type, required) VALUES
      ${geographyFieldRows}
    ON CONFLICT (page_key, id) DO NOTHING;
  `,
};
