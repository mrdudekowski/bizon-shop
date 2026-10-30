import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import type { Migration } from "../migrationRunner";

const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

const paragraphs = (parts: readonly string[]): string => parts.join("\n\n");

const SUPPLIER_NOTICE =
  "Заявка не создаёт обязательств автоматически: коммерческие условия и регионы подтверждаются отдельно.";

const chapters: readonly (readonly [string, string, number, string, string])[] = [
  ["delivery", "delivery-where", 0, "Куда возим", CUSTOMER_COPY.geography[0]],
  ["delivery", "delivery-calculation", 1, "Как считаем срок и стоимость", paragraphs(CUSTOMER_COPY.geography.slice(1))],
  ["shop-delivery", "shop-delivery-method", 0, "Доставка", paragraphs(CUSTOMER_COPY.delivery)],
  ["payment", "payment-terms", 0, "Оплата", paragraphs(CUSTOMER_COPY.payment)],
  ["shop-payment", "shop-payment-ordering", 0, "Оформление заявки", CUSTOMER_COPY.shopDeliveryOrdering],
  ["shop-payment", "shop-payment-terms", 1, "Оплата", paragraphs(CUSTOMER_COPY.payment)],
  ["shop-warranty", "shop-warranty-returns", 0, "Возврат", paragraphs(CUSTOMER_COPY.returns)],
];

function chapterInsert(pageKey: string, id: string, order: number, heading: string, body: string): string {
  return `
    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT ${sqlLiteral(id)}, p.id, ${order}, ${sqlLiteral(heading)}, ${sqlLiteral(body)}
    FROM pages AS p
    WHERE p.key = ${sqlLiteral(pageKey)}
    ON CONFLICT (_parent_id, id) DO UPDATE
      SET _order = EXCLUDED._order, heading = EXCLUDED.heading, body = EXCLUDED.body;
  `;
}

const chapterSql = chapters
  .map(([pageKey, id, order, heading, body]) => chapterInsert(pageKey, id, order, heading, body))
  .join("\n");

/**
 * Publishes the approved service and shop copy. Warranty section bodies stay as they are;
 * only their headings change. delivery-geography and shop-delivery-returns are not rewritten.
 */
export const publishedPageCopyMigration: Migration = {
  version: "202610300035",
  description: "Publish service and shop page copy on the new page keys",
  sql: `
    UPDATE pages
    SET stub_hero_title = 'Доставка',
        stub_hero_lead = '',
        stub_hero_configured = true,
        editorial_configured = true,
        editorial_sections_configured = true,
        editorial_notice_configured = false,
        editorial_notice = '',
        editorial_proof_configured = false,
        editorial_proof_title = '',
        editorial_proof_text = '',
        editorial_proof_image_id = NULL,
        editorial_proof_image_alt = '',
        updated_at = now()
    WHERE key = 'delivery';

    UPDATE pages
    SET stub_hero_title = 'Доставка',
        stub_hero_lead = '',
        stub_hero_configured = true,
        editorial_configured = true,
        editorial_sections_configured = true,
        updated_at = now()
    WHERE key = 'shop-delivery';

    UPDATE pages
    SET stub_hero_title = 'Оплата',
        stub_hero_configured = true,
        editorial_configured = true,
        editorial_sections_configured = true,
        updated_at = now()
    WHERE key IN ('payment', 'shop-payment');

    UPDATE pages
    SET stub_hero_title = 'Гарантия и возврат',
        stub_hero_lead = '',
        stub_hero_configured = true,
        editorial_configured = true,
        editorial_sections_configured = true,
        updated_at = now()
    WHERE key = 'shop-warranty';

    ${chapterSql}

    UPDATE pages
    SET stub_hero_title = 'Гарантия и возврат',
        stub_hero_configured = true,
        editorial_notice_configured = true,
        editorial_notice = '',
        editorial_proof_configured = true,
        editorial_proof_title = '',
        editorial_proof_text = '',
        editorial_proof_image_id = NULL,
        editorial_proof_image_alt = '',
        updated_at = now()
    WHERE key = 'warranty';

    UPDATE pages_editorial_sections AS section
    SET heading = seeded.heading
    FROM pages AS p,
         (VALUES
           ('warranty-claim'::text, 'Обращение'::text),
           ('warranty-review'::text, 'Проверка'::text),
           ('warranty-exclusions'::text, 'Исключения'::text),
           ('warranty-terms'::text, 'Сроки и объём'::text)
         ) AS seeded(id, heading)
    WHERE section._parent_id = p.id
      AND p.key = 'warranty'
      AND section.id = seeded.id;

    DELETE FROM pages_editorial_sections AS section
    USING pages AS p
    WHERE section._parent_id = p.id
      AND p.key = 'become-a-supplier'
      AND section.id IN ('supplier-cooperation', 'supplier-terms');

    UPDATE pages
    SET editorial_configured = true,
        editorial_sections_configured = true,
        editorial_notice_configured = true,
        editorial_notice = ${sqlLiteral(SUPPLIER_NOTICE)},
        editorial_proof_configured = true,
        editorial_proof_title = '',
        editorial_proof_text = '',
        editorial_proof_image_id = NULL,
        editorial_proof_image_alt = '',
        updated_at = now()
    WHERE key = 'become-a-supplier';

    DELETE FROM pages_editorial_sections AS section
    USING pages AS p
    WHERE section._parent_id = p.id
      AND p.key = 'shop-become-a-supplier';

    UPDATE pages AS shop
    SET stub_hero_title = source.stub_hero_title,
        stub_hero_lead = source.stub_hero_lead,
        stub_hero_configured = true,
        editorial_configured = true,
        editorial_sections_configured = true,
        editorial_notice_configured = true,
        editorial_notice = ${sqlLiteral(SUPPLIER_NOTICE)},
        editorial_proof_configured = false,
        editorial_proof_title = '',
        editorial_proof_text = '',
        editorial_proof_image_id = NULL,
        editorial_proof_image_alt = '',
        updated_at = now()
    FROM pages AS source
    WHERE shop.key = 'shop-become-a-supplier'
      AND source.key = 'become-a-supplier';
  `,
};
