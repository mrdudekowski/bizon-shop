import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import { SITE_PROFILE_DEFAULTS } from "../content/siteProfile";
import type { Migration } from "../migrationRunner";

/** The database cannot import TypeScript, so the shared sentences are inlined as escaped literals. */
const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

const requisitePlaceholder = sqlLiteral(CUSTOMER_COPY.requisitePlaceholder);

/**
 * One site profile (contacts, messenger channels, legal requisites) replaces the footer_* columns of the
 * contact page. The columns stay in place; their values are copied once and never read again.
 */
export const siteProfileMigration: Migration = {
  version: "202610290023",
  description: "Store contacts, messenger channels, and legal requisites in one site profile",
  sql: `
    CREATE TABLE IF NOT EXISTS site_profile (
      id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      phone text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      channels_note text NOT NULL DEFAULT '',
      legal_summary text NOT NULL DEFAULT '',
      price_notice text NOT NULL DEFAULT '',
      made_to_order_notice text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS site_profile_channels (
      id text PRIMARY KEY,
      sort_order int NOT NULL,
      label text NOT NULL,
      href text NOT NULL DEFAULT '',
      enabled boolean NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS site_profile_requisites (
      id text PRIMARY KEY,
      sort_order int NOT NULL,
      label text NOT NULL,
      value text NOT NULL DEFAULT ''
    );

    INSERT INTO site_profile (id, phone, email, address, channels_note, legal_summary, price_notice, made_to_order_notice)
    SELECT 1,
      CASE WHEN btrim(footer_phone) = '' THEN ${sqlLiteral(SITE_PROFILE_DEFAULTS.phone)} ELSE footer_phone END,
      CASE WHEN btrim(footer_email) = '' THEN ${sqlLiteral(SITE_PROFILE_DEFAULTS.email)} ELSE footer_email END,
      CASE WHEN btrim(footer_address) = '' THEN ${sqlLiteral(SITE_PROFILE_DEFAULTS.address)} ELSE footer_address END,
      ${sqlLiteral(SITE_PROFILE_DEFAULTS.channelsNote)},
      ${sqlLiteral(SITE_PROFILE_DEFAULTS.legalSummary)},
      ${sqlLiteral(SITE_PROFILE_DEFAULTS.priceNotice)},
      ${sqlLiteral(SITE_PROFILE_DEFAULTS.madeToOrderNotice)}
    FROM pages WHERE key::text = 'contact'
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO site_profile_channels (id, sort_order, label, href, enabled) VALUES
      ('telegram', 0, 'Telegram', '', true),
      ('whatsapp', 1, 'WhatsApp', '', true),
      ('max', 2, 'MAX', '', true),
      ('vk', 3, 'VK', '', true),
      ('instagram', 4, 'Instagram', '', true)
    ON CONFLICT (id) DO NOTHING;

    UPDATE site_profile_channels AS channel
    SET href = source.href
    FROM (
      SELECT 'telegram' AS id, footer_telegram AS href FROM pages WHERE key::text = 'contact'
      UNION ALL SELECT 'whatsapp', footer_whatsapp FROM pages WHERE key::text = 'contact'
      UNION ALL SELECT 'max', footer_max FROM pages WHERE key::text = 'contact'
      UNION ALL SELECT 'vk', footer_vk FROM pages WHERE key::text = 'contact'
      UNION ALL SELECT 'instagram', footer_instagram FROM pages WHERE key::text = 'contact'
    ) AS source
    WHERE channel.id = source.id AND btrim(channel.href) = '' AND btrim(source.href) <> '';

    INSERT INTO site_profile_requisites (id, sort_order, label, value) VALUES
      ('legal-name', 0, 'Полное наименование', ${requisitePlaceholder}),
      ('legal-address', 1, 'Юридический адрес', ${requisitePlaceholder}),
      ('inn', 2, 'ИНН', ${requisitePlaceholder}),
      ('ogrn', 3, 'ОГРН', ${requisitePlaceholder})
    ON CONFLICT (id) DO NOTHING;
  `,
};
