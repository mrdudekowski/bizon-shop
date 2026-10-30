import type { Migration } from "../migrationRunner";

/** Seeds one published row per twin key. Sections stay empty; each insert names only its own key. Uses the enum values added by 0030. */
export const pageTwinPagesMigration: Migration = {
  version: "202610300031",
  description: "Publish empty service and shop page twins",
  sql: `
    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'delivery', 'Доставка', 'published', 'Доставка', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'delivery');

    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'payment', 'Оплата', 'published', 'Оплата', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'payment');

    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'shop-delivery', 'Доставка', 'published', 'Доставка', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'shop-delivery');

    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'shop-payment', 'Оплата', 'published', 'Оплата', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'shop-payment');

    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'shop-warranty', 'Гарантия и возврат', 'published', 'Гарантия и возврат', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'shop-warranty');

    INSERT INTO pages (
      key, title, status, stub_hero_title, stub_hero_lead,
      stub_hero_configured, editorial_configured, editorial_sections_configured
    )
    SELECT 'shop-become-a-supplier', 'Стать поставщиком', 'published', 'Стать поставщиком', '',
      true, true, true
    WHERE NOT EXISTS (SELECT 1 FROM pages WHERE key = 'shop-become-a-supplier');
  `,
};
