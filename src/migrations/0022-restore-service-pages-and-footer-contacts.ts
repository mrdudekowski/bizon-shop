import type { Migration } from "../migrationRunner";

/**
 * Seeds editorial content for 'about', 'contact', 'become-a-supplier', and 'warranty',
 * publishes all four pages so they do not return 404 on the public site,
 * and adds footer contact & messenger columns to the 'pages' table for the 'contact' page.
 */
export const restoreServicePagesAndFooterContactsMigration: Migration = {
  version: "202610260022",
  description: "Restore and publish about, contact, warranty, and become-a-supplier pages; add footer contact and messenger columns",
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS footer_phone text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_email text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_address text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_telegram text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_whatsapp text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_max text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_vk text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS footer_instagram text NOT NULL DEFAULT '';

    INSERT INTO pages_editorial_features (id, _parent_id, _order, title, text)
    SELECT seeded.id, p.id, seeded.position, seeded.title, seeded.text
    FROM pages AS p
    JOIN (VALUES
      ('about', 'about-feature-1', 0, 'Подбор по задаче', 'Каталог TBR и OTR строится вокруг техники и условий эксплуатации — без имитации фильтров, которых ещё нет в данных.'),
      ('about', 'about-feature-2', 1, 'B2B-коммуникация', 'Заявка передаёт менеджеру контакты и контекст задачи. Условия поставки и наличие типоразмера подтверждаются индивидуально.'),
      ('about', 'about-feature-3', 2, 'Проверенный ассортимент', 'На сайте публикуются только направления и модели с готовыми страницами. Пустые витрины и демонстрационные остатки не показываем.'),
      ('become-a-supplier', 'supplier-feature-1', 0, 'Расскажите о компании', 'Укажите регион, направление работы и профиль клиентов — это поможет подготовить предметный ответ.'),
      ('become-a-supplier', 'supplier-feature-2', 1, 'Обсудим формат', 'Согласуем номенклатуру, потребности автопарков и возможный формат сотрудничества.'),
      ('become-a-supplier', 'supplier-feature-3', 2, 'Подготовим следующий шаг', 'Менеджер свяжется, чтобы уточнить детали и определить дальнейший порядок работы.'),
      ('warranty', 'warranty-feature-1', 0, 'Зафиксируйте данные', 'Подготовьте модель и размер шины, дату и место приобретения, пробег, положение на технике и описание ситуации.'),
      ('warranty', 'warranty-feature-2', 1, 'Приложите материалы', 'Сделайте фотографии шины, маркировки и зоны проверки. Не утилизируйте изделие до ответа менеджера.'),
      ('warranty', 'warranty-feature-3', 2, 'Отправьте запрос', 'Опишите случай в форме контактов. Менеджер вернётся с перечнем документов и дальнейшим порядком рассмотрения.')
    ) AS seeded(page_key, id, position, title, text) ON p.key::text = seeded.page_key
    WHERE p.editorial_configured = false
    ON CONFLICT (_parent_id, id) DO NOTHING;

    UPDATE pages
    SET stub_hero_configured = true,
        stub_hero_eyebrow = CASE
          WHEN COALESCE(stub_hero_eyebrow, '') NOT IN ('', 'BIZON') THEN stub_hero_eyebrow
          WHEN key = 'about' THEN 'BIZON · Heavy Duty'
          WHEN key = 'become-a-supplier' THEN 'Партнёрство'
          WHEN key = 'warranty' THEN 'Поддержка'
          WHEN key = 'contact' THEN 'BIZON · Заявка'
          ELSE stub_hero_eyebrow
        END,
        stub_hero_title = CASE
          WHEN key = 'about' AND COALESCE(stub_hero_title, '') IN ('', 'О компании') THEN 'О компании BIZON'
          WHEN key = 'become-a-supplier' AND COALESCE(stub_hero_title, '') = '' THEN 'Стать поставщиком'
          WHEN key = 'warranty' AND COALESCE(stub_hero_title, '') = '' THEN 'Гарантия и обращение'
          WHEN key = 'contact' AND COALESCE(stub_hero_title, '') = '' THEN 'Контакты'
          ELSE stub_hero_title
        END,
        stub_hero_lead = CASE
          WHEN COALESCE(stub_hero_lead, '') <> '' THEN stub_hero_lead
          WHEN key = 'about' THEN 'Помогаем автопаркам подобрать шины под технику, маршрут и нагрузку — и передать запрос специалистам без лишних обещаний.'
          WHEN key = 'become-a-supplier' THEN 'Начните диалог о поставках, ассортименте и работе с профессиональным рынком грузовых шин.'
          WHEN key = 'warranty' THEN 'Порядок первичного обращения по гарантийному вопросу. Финальные сроки и объём условий подтверждает поставщик.'
          WHEN key = 'contact' THEN 'Расчёт, консультация по шинам и вопросы для fleet-операторов.'
          ELSE stub_hero_lead
        END,
        stub_hero_image_id = COALESCE(
          stub_hero_image_id,
          CASE
            WHEN key = 'about' THEN (SELECT id FROM media WHERE url = '/images/premium/highway-fleet-portrait.png' LIMIT 1)
            WHEN key = 'become-a-supplier' THEN (SELECT id FROM media WHERE url = '/images/premium/quarry-haul-truck.png' LIMIT 1)
            WHEN key = 'warranty' THEN (SELECT id FROM media WHERE url = '/images/premium/tread-inspection.jpg' LIMIT 1)
            ELSE NULL
          END
        ),
        stub_hero_image_alt = CASE
          WHEN COALESCE(stub_hero_image_alt, '') <> '' THEN stub_hero_image_alt
          WHEN key = 'about' THEN 'Коммерческий автопарк на маршруте'
          WHEN key = 'become-a-supplier' THEN 'Техника в смешанных условиях эксплуатации'
          WHEN key = 'warranty' THEN 'Проверка протектора шины'
          ELSE ''
        END,
        seo_seo_title = CASE
          WHEN COALESCE(seo_seo_title, '') <> '' THEN seo_seo_title
          WHEN key = 'about' THEN 'О компании'
          WHEN key = 'become-a-supplier' THEN 'Стать поставщиком'
          WHEN key = 'warranty' THEN 'Гарантия'
          WHEN key = 'contact' THEN 'Контакты'
          ELSE seo_seo_title
        END,
        seo_seo_description = CASE
          WHEN COALESCE(seo_seo_description, '') <> '' THEN seo_seo_description
          WHEN key = 'about' THEN 'Помогаем автопаркам подобрать шины под технику, маршрут и нагрузку — и передать запрос специалистам без лишних обещаний.'
          WHEN key = 'become-a-supplier' THEN 'Начните диалог о поставках, ассортименте и работе с профессиональным рынком грузовых шин.'
          WHEN key = 'warranty' THEN 'Порядок первичного обращения по гарантийному вопросу. Финальные сроки и объём условий подтверждает поставщик.'
          WHEN key = 'contact' THEN 'Свяжитесь с BIZON для расчёта, консультации по шинам или вопросам парка.'
          ELSE seo_seo_description
        END,
        editorial_configured = CASE WHEN key IN ('about', 'become-a-supplier', 'warranty') THEN true ELSE editorial_configured END,
        editorial_heading_configured = CASE WHEN key IN ('about', 'become-a-supplier', 'warranty') THEN true ELSE editorial_heading_configured END,
        editorial_features_configured = CASE WHEN key IN ('about', 'become-a-supplier', 'warranty') THEN true ELSE editorial_features_configured END,
        editorial_proof_configured = CASE WHEN key IN ('about', 'become-a-supplier', 'warranty') THEN true ELSE editorial_proof_configured END,
        editorial_cta_configured = CASE WHEN key IN ('about', 'become-a-supplier', 'warranty') THEN true ELSE editorial_cta_configured END,
        editorial_features_heading = CASE
          WHEN COALESCE(editorial_features_heading, '') <> '' THEN editorial_features_heading
          WHEN key = 'about' THEN 'Как мы работаем'
          WHEN key = 'become-a-supplier' THEN 'Как проходит первичное обращение'
          WHEN key = 'warranty' THEN 'Три шага для первичной проверки'
          ELSE editorial_features_heading
        END,
        editorial_proof_title = CASE
          WHEN COALESCE(editorial_proof_title, '') <> '' THEN editorial_proof_title
          WHEN key = 'about' THEN 'От задачи парка — к проверяемой рекомендации'
          WHEN key = 'become-a-supplier' THEN 'Работаем с профессиональным рынком'
          WHEN key = 'warranty' THEN 'Что обычно фиксируется в гарантии'
          ELSE editorial_proof_title
        END,
        editorial_proof_text = CASE
          WHEN COALESCE(editorial_proof_text, '') <> '' THEN editorial_proof_text
          WHEN key = 'about' THEN 'Предварительный подбор помогает сузить направление. Финальную совместимость и наличие подтверждает специалист BIZON.'
          WHEN key = 'become-a-supplier' THEN 'Заявка не создаёт обязательств автоматически: коммерческие условия и регионы подтверждаются отдельно.'
          WHEN key = 'warranty' THEN 'В финальной версии указывают продавца или поставщика, модели, срок и объём гарантии, исключения, процедуру экспертизы и каналы обращения.'
          ELSE editorial_proof_text
        END,
        editorial_cta_label = CASE
          WHEN COALESCE(editorial_cta_label, '') <> '' THEN editorial_cta_label
          WHEN key = 'about' THEN 'Открыть каталог'
          WHEN key = 'become-a-supplier' THEN 'Оставить заявку'
          WHEN key = 'warranty' THEN 'Задать вопрос по гарантии'
          ELSE editorial_cta_label
        END,
        editorial_cta_href = CASE
          WHEN COALESCE(editorial_cta_href, '') <> '' THEN editorial_cta_href
          WHEN key = 'about' THEN '/models'
          WHEN key = 'become-a-supplier' THEN '/contact?subject=supplier'
          WHEN key = 'warranty' THEN '/contact?subject=warranty'
          ELSE editorial_cta_href
        END,
        editorial_secondary_label = CASE
          WHEN COALESCE(editorial_secondary_label, '') <> '' THEN editorial_secondary_label
          WHEN key = 'about' THEN 'Связаться напрямую'
          ELSE editorial_secondary_label
        END,
        editorial_secondary_href = CASE
          WHEN COALESCE(editorial_secondary_href, '') <> '' THEN editorial_secondary_href
          WHEN key = 'about' THEN '/contact'
          ELSE editorial_secondary_href
        END,
        status = 'published',
        updated_at = now()
    WHERE key IN ('about', 'contact', 'warranty', 'become-a-supplier');
  `,
};
