import type { Migration } from "../migrationRunner";

export const stubHeroContentMigration: Migration = {
  version: "202610230015",
  description: "Track when editorial page Hero fields are controlled by CMS",
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS stub_hero_configured boolean NOT NULL DEFAULT false;

    UPDATE pages
    SET stub_hero_configured = true
    WHERE key IN ('about', 'contact', 'warranty', 'branding', 'become-a-supplier', 'privacy-policy', 'shop-delivery-returns')
      AND status = 'published'
      AND (
        COALESCE(stub_hero_eyebrow, '') <> ''
        OR COALESCE(stub_hero_title, '') <> ''
        OR COALESCE(stub_hero_lead, '') <> ''
        OR stub_hero_image_id IS NOT NULL
        OR editorial_configured
      );
  `,
};
