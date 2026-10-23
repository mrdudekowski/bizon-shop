import type { Migration } from "../migrationRunner";

export const shopDeliveryEditorialContentMigration: Migration = {
  version: "202610230017",
  description: "Move current Shop delivery and returns copy into CMS editorial fields",
  sql: `
    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT seeded.id, p.id, seeded.position, seeded.heading, seeded.body
    FROM pages AS p
    JOIN (VALUES
      ('shop-delivery-returns', 'delivery-section-ordering', 0, 'Оформление заявки', 'Добавьте позиции в корзину и оставьте контакты. Менеджер уточнит наличие, цену, способ и срок поставки до оформления сделки.'),
      ('shop-delivery-returns', 'delivery-section-shipping', 1, 'Доставка', 'Доставка по России транспортной компанией или самовывоз — по согласованию. Стоимость и дата зависят от габаритов заказа, региона и перевозчика и фиксируются в предложении менеджера.'),
      ('shop-delivery-returns', 'delivery-section-returns', 2, 'Возврат и обмен', 'До использования товара направьте заявку с номером заказа и фотографиями. Возможность возврата, адрес и расходы на перевозку подтверждаются после проверки основания обращения.')
    ) AS seeded(page_key, id, position, heading, body) ON p.key::text = seeded.page_key
    WHERE p.key::text = 'shop-delivery-returns'
      AND p.editorial_configured = false
    ON CONFLICT (_parent_id, id) DO NOTHING;

    UPDATE pages
    SET editorial_configured = true,
        editorial_features_configured = true,
        editorial_sections_configured = true,
        editorial_notice_configured = true,
        editorial_notice = 'Shop принимает заявку, а не онлайн-оплату. Срок, стоимость и возможность возврата фиксируются в предложении менеджера до сделки.',
        updated_at = now()
    WHERE key::text = 'shop-delivery-returns'
      AND editorial_configured = false;
  `,
};
