import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import type { Migration } from "../migrationRunner";

/** The database cannot import TypeScript, so the shared sentence is inlined as an escaped literal. */
const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

/** Supplier form fields in display order: id, label, type, required. */
const SUPPLIER_FIELDS: readonly (readonly [string, string, string, boolean])[] = [
  ["companyName", "Название компании", "text", true],
  ["contactName", "Контактное лицо", "text", true],
  ["phone", "Телефон", "tel", true],
  ["email", "Email", "email", true],
  ["companySite", "Сайт компании", "url", false],
  ["category", "Категория продукции", "text", true],
  ["offer", "Краткое описание предложения", "textarea", true],
  ["catalogFile", "Файл или каталог", "file", false],
];

const supplierFieldRows = SUPPLIER_FIELDS.map(
  ([id, label, type, required], index) =>
    `('become-a-supplier', ${sqlLiteral(id)}, ${index}, ${sqlLiteral(label)}, ${sqlLiteral(type)}, ${required})`,
).join(",\n      ");

/** Page forms are data: fields and the thank-you sentence live in the database, and answers are stored with the request. */
export const pageFormsMigration: Migration = {
  version: "202610290025",
  description: "Store page forms, their fields, and form answers with requests",
  sql: `
    CREATE TABLE IF NOT EXISTS page_forms (
      page_key text PRIMARY KEY,
      success_message text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_form_fields (
      page_key text NOT NULL REFERENCES page_forms(page_key),
      id text NOT NULL,
      sort_order int NOT NULL,
      label text NOT NULL,
      field_type text NOT NULL,
      required boolean NOT NULL DEFAULT false,
      PRIMARY KEY (page_key, id)
    );

    ALTER TABLE requests ADD COLUMN IF NOT EXISTS form_answers jsonb;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS attachment_url text;

    INSERT INTO page_forms (page_key, success_message)
    VALUES ('become-a-supplier', ${sqlLiteral(CUSTOMER_COPY.supplierSuccess)})
    ON CONFLICT (page_key) DO NOTHING;

    INSERT INTO page_form_fields (page_key, id, sort_order, label, field_type, required) VALUES
      ${supplierFieldRows}
    ON CONFLICT (page_key, id) DO NOTHING;
  `,
};
