import type { Migration } from "../migrationRunner";

/**
 * Request forms no longer accept files. The seeded process headings are narration
 * above the real text, and a page that already has a request form does not need a closing button.
 */
export const dropFormFilesAndProcessHeadingsMigration: Migration = {
  version: "202610300029",
  description: "Drop file fields from request forms, process headings, and the next-step button on form pages",
  sql: `
    DELETE FROM page_form_fields WHERE field_type = 'file';

    UPDATE pages
    SET editorial_features_heading = '',
        updated_at = now()
    WHERE btrim(editorial_features_heading) IN (
      'Как проходит первичное обращение',
      'Три шага для первичной проверки',
      'Как мы работаем',
      'Кратко о обработке данных'
    );

    UPDATE pages
    SET editorial_cta_label = '',
        editorial_cta_href = '',
        editorial_secondary_label = '',
        editorial_secondary_href = '',
        updated_at = now()
    WHERE key IN ('become-a-supplier', 'delivery-geography', 'contact');
  `,
};
