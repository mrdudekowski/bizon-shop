import type { Migration } from "../migrationRunner";

export const homepageEditorialContentMigration: Migration = {
  version: "202610120009",
  description: "Homepage branding and expertise editorial content",
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS home_expertise_image_id integer REFERENCES media(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS home_expertise_image_alt text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_expertise_cta_label text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_expertise_cta_href text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_eyebrow text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_title text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_lead text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_cta_label text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_cta_href text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_before_caption text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_after_caption text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_before_image_id integer REFERENCES media(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS home_branding_before_image_alt text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS home_branding_after_image_id integer REFERENCES media(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS home_branding_after_image_alt text NOT NULL DEFAULT '';
    INSERT INTO media (title, alt, filename, mime_type, url, object_key, declared_mime_type, sha256, filesize)
    SELECT seed.title, seed.alt, seed.filename, seed.mime_type, seed.url, NULL, seed.mime_type, NULL, seed.filesize
    FROM (VALUES
      ('Homepage expertise fallback'::text, 'Специалист измеряет глубину протектора грузовой шины'::text, 'tread-inspection.jpg'::text, 'image/jpeg'::text, '/images/premium/tread-inspection.jpg'::text, 153088::bigint),
      ('Homepage branding plain fallback'::text, 'Шина BIZON без брендирования'::text, 'branding-tire-plain.jpg'::text, 'image/jpeg'::text, '/images/premium/branding-tire-plain.jpg'::text, 143787::bigint),
      ('Homepage branding marked fallback'::text, 'Шина BIZON с брендированием'::text, 'branding-tire-branded.jpg'::text, 'image/jpeg'::text, '/images/premium/branding-tire-branded.jpg'::text, 141541::bigint)
    ) AS seed(title, alt, filename, mime_type, url, filesize)
    WHERE NOT EXISTS (SELECT 1 FROM media AS existing WHERE existing.url = seed.url);

    UPDATE pages SET
      home_expertise_image_id = COALESCE(home_expertise_image_id, (SELECT id FROM media WHERE url = '/images/premium/tread-inspection.jpg' ORDER BY id LIMIT 1)),
      home_branding_before_image_id = COALESCE(home_branding_before_image_id, (SELECT id FROM media WHERE url = '/images/premium/branding-tire-plain.jpg' ORDER BY id LIMIT 1)),
      home_branding_after_image_id = COALESCE(home_branding_after_image_id, (SELECT id FROM media WHERE url = '/images/premium/branding-tire-branded.jpg' ORDER BY id LIMIT 1))
    WHERE key = 'home';
    UPDATE pages SET
      home_expertise_eyebrow = CASE WHEN COALESCE(home_expertise_eyebrow, '') IN ('', 'Практика и опыт') THEN 'TIRE IQ · Практика и опыт' ELSE home_expertise_eyebrow END,
      home_expertise_image_alt = CASE WHEN COALESCE(home_expertise_image_alt, '') = '' THEN 'Специалист измеряет глубину протектора грузовой шины' ELSE home_expertise_image_alt END,
      home_expertise_cta_label = CASE WHEN COALESCE(home_expertise_cta_label, '') = '' THEN 'Перейти к материалам' ELSE home_expertise_cta_label END,
      home_expertise_cta_href = CASE WHEN COALESCE(home_expertise_cta_href, '') = '' THEN '/tire-iq' ELSE home_expertise_cta_href END,
      home_branding_title = CASE WHEN COALESCE(home_branding_title, '') = '' THEN 'Ваш бренд на шинах' ELSE home_branding_title END,
      home_branding_lead = CASE WHEN COALESCE(home_branding_lead, '') = '' THEN 'Ваш бренд на шинах. Больше узнаваемости, сильнее присутствие, единый индустриальный стиль.' ELSE home_branding_lead END,
      home_branding_cta_label = CASE WHEN COALESCE(home_branding_cta_label, '') = '' THEN 'Обсудить проект' ELSE home_branding_cta_label END,
      home_branding_cta_href = CASE WHEN COALESCE(home_branding_cta_href, '') = '' THEN '/contact?subject=branding' ELSE home_branding_cta_href END,
      home_branding_before_caption = CASE WHEN COALESCE(home_branding_before_caption, '') = '' THEN 'Стандартный' ELSE home_branding_before_caption END,
      home_branding_after_caption = CASE WHEN COALESCE(home_branding_after_caption, '') = '' THEN 'Брендированный' ELSE home_branding_after_caption END,
      home_branding_before_image_alt = CASE WHEN COALESCE(home_branding_before_image_alt, '') = '' THEN 'Шина BIZON без брендирования' ELSE home_branding_before_image_alt END,
      home_branding_after_image_alt = CASE WHEN COALESCE(home_branding_after_image_alt, '') = '' THEN 'Шина BIZON с брендированием' ELSE home_branding_after_image_alt END
    WHERE key = 'home';
  `,
};
