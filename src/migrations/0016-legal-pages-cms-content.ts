import type { Migration } from "../migrationRunner";

/**
 * Moves the currently rendered warranty and privacy page copy into the CMS
 * records. Existing editorial records are left untouched. The privacy policy
 * contains demo legal details and must be reviewed before any production
 * deployment of this migration.
 */
export const legalPagesCmsContentMigration: Migration = {
  version: "202610230016",
  description: "Seed current warranty and privacy page content into CMS",
  sql: `
    INSERT INTO pages_editorial_features (id, _parent_id, _order, title, text)
    SELECT seeded.id, p.id, seeded.position, seeded.title, seeded.text
    FROM pages AS p
    JOIN (VALUES
      ('warranty', 'warranty-feature-1', 0, 'Зафиксируйте данные', 'Подготовьте модель и размер шины, дату и место приобретения, пробег, положение на технике и описание ситуации.'),
      ('warranty', 'warranty-feature-2', 1, 'Приложите материалы', 'Сделайте фотографии шины, маркировки и зоны проверки. Не утилизируйте изделие до ответа менеджера.'),
      ('warranty', 'warranty-feature-3', 2, 'Отправьте запрос', 'Опишите случай в форме контактов. Менеджер вернётся с перечнем документов и дальнейшим порядком рассмотрения.'),
      ('privacy-policy', 'privacy-feature-1', 0, 'Оператор', 'ООО «БИЗОН ТАЙРС». Адрес: г. Москва, пример юридического адреса, 1.'),
      ('privacy-policy', 'privacy-feature-2', 1, 'Какие данные обрабатываются', 'Имя, телефон, email, сведения о компании, комментарий, состав заявки; технические метки источника обращения.'),
      ('privacy-policy', 'privacy-feature-3', 2, 'Цели', 'Обработка заявки, подбор решения, подготовка расчёта и связь с пользователем. Рекламные рассылки — только при отдельном согласии.')
    ) AS seeded(page_key, id, position, title, text) ON p.key::text = seeded.page_key
    WHERE p.editorial_configured = false
      AND p.status::text = 'draft'
    ON CONFLICT (_parent_id, id) DO NOTHING;

    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT seeded.id, p.id, seeded.position, seeded.heading, seeded.body
    FROM pages AS p
    JOIN (VALUES
      ('privacy-policy', 'privacy-section-1', 0, 'Подробности политики', '1. Оператор и область действия\n\nОператором персональных данных является ООО «БИЗОН ТАЙРС». Политика применяется к данным, передаваемым через формы на сайтах BIZON Tires и BIZON Shop.\n\nАдрес оператора: г. Москва, пример юридического адреса, 1.'),
      ('privacy-policy', 'privacy-section-2', 1, '2. Передача и хранение', 'Данные хранятся в инфраструктуре проекта и могут передаваться уполномоченным обработчикам только в объёме, необходимом для работы сайта и обработки заявки: хостинг, почтовый сервис и Telegram после настройки.'),
      ('privacy-policy', 'privacy-section-3', 2, '3. Права пользователя', 'Пользователь может запросить уточнение, блокирование или удаление данных, а также отозвать согласие. Для обращения используйте email privacy@example.bizon.ru и укажите данные, позволяющие идентифицировать заявку.')
    ) AS seeded(page_key, id, position, heading, body) ON p.key::text = seeded.page_key
    WHERE p.editorial_configured = false
      AND p.status::text = 'draft'
    ON CONFLICT (_parent_id, id) DO NOTHING;

    UPDATE pages
    SET stub_hero_configured = true,
        stub_hero_eyebrow = CASE key WHEN 'warranty' THEN 'Поддержка' ELSE 'Документы' END,
        stub_hero_title = CASE key WHEN 'warranty' THEN 'Гарантия и обращение' ELSE 'Политика конфиденциальности' END,
        stub_hero_lead = CASE key
          WHEN 'warranty' THEN 'Порядок первичного обращения по гарантийному вопросу. Финальные сроки и объём условий подтверждает поставщик.'
          ELSE 'Принципы обработки персональных данных при отправке заявок на сайтах BIZON Tires и BIZON Shop.'
        END,
        stub_hero_image_id = CASE WHEN key = 'warranty' THEN (SELECT id FROM media WHERE url = '/images/premium/tread-inspection.jpg' LIMIT 1) ELSE NULL END,
        stub_hero_image_alt = CASE WHEN key = 'warranty' THEN 'Проверка протектора шины' ELSE '' END,
        seo_seo_title = CASE key WHEN 'warranty' THEN 'Гарантия' ELSE 'Политика конфиденциальности' END,
        seo_seo_description = CASE key
          WHEN 'warranty' THEN 'Порядок первичного обращения по гарантийному вопросу. Финальные сроки и объём условий подтверждает поставщик.'
          ELSE 'Принципы обработки персональных данных при использовании сайта BIZON.'
        END,
        editorial_configured = true,
        editorial_heading_configured = true,
        editorial_features_configured = true,
        editorial_sections_configured = (key = 'privacy-policy'),
        editorial_notice_configured = true,
        editorial_proof_configured = (key = 'warranty'),
        editorial_cta_configured = (key = 'warranty'),
        editorial_features_heading = CASE key WHEN 'warranty' THEN 'Три шага для первичной проверки' ELSE 'Кратко о обработке данных' END,
        editorial_notice = CASE key
          WHEN 'warranty' THEN 'Пример ниже не устанавливает срок или объём гарантии. Перед запуском его заменяют условия поставщика и подтверждающие документы.'
          ELSE 'Перед production-запуском замените пример оператора, адрес и email на подтверждённые реквизиты, а текст — на версию, проверенную юристом.'
        END,
        editorial_proof_title = CASE WHEN key = 'warranty' THEN 'Что обычно фиксируется в гарантии' ELSE '' END,
        editorial_proof_text = CASE WHEN key = 'warranty' THEN 'В финальной версии указывают продавца или поставщика, модели, срок и объём гарантии, исключения, процедуру экспертизы и каналы обращения.' ELSE '' END,
        editorial_proof_image_id = NULL,
        editorial_proof_image_alt = CASE WHEN key = 'warranty' THEN 'Консультация специалиста BIZON' ELSE '' END,
        editorial_cta_label = CASE WHEN key = 'warranty' THEN 'Задать вопрос по гарантии' ELSE '' END,
        editorial_cta_href = CASE WHEN key = 'warranty' THEN '/contact?subject=warranty' ELSE '' END,
        editorial_secondary_label = '',
        editorial_secondary_href = '',
        updated_at = now()
    WHERE key IN ('warranty', 'privacy-policy')
      AND editorial_configured = false
      AND status::text = 'draft';
  `,
};
