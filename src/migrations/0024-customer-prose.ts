import { CUSTOMER_COPY, SEEDED_COPY } from "../content/customerTemplateCopy";
import type { Migration } from "../migrationRunner";

const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

const heroLeadReplaceWhere = (previous: string): string =>
  `(btrim(COALESCE(stub_hero_lead, '')) = '' OR stub_hero_lead = ${sqlLiteral(previous)})`;

const aboutLead = sqlLiteral(CUSTOMER_COPY.about[0]);
const aboutCustomersBody = sqlLiteral(CUSTOMER_COPY.about[1]);
const aboutTermsBody = sqlLiteral(CUSTOMER_COPY.about[2]);
const warrantyLead = sqlLiteral(CUSTOMER_COPY.warranty[0]);
const warrantyClaimBody = sqlLiteral(CUSTOMER_COPY.warranty[1]);
const warrantyReviewBody = sqlLiteral(CUSTOMER_COPY.warranty[2]);
const warrantyExclusionsBody = sqlLiteral(CUSTOMER_COPY.warranty[3]);
const warrantyTermsBody = sqlLiteral(CUSTOMER_COPY.warranty[4]);

/**
 * Replaces legacy about/warranty story cards with customer-template prose sections.
 * Hero leads and feature deletes run only while the row still matches migration 0022 seeds.
 */
export const customerProseMigration: Migration = {
  version: "202610290024",
  description: "Seed customer-template about and warranty prose into CMS editorial fields",
  sql: `
    UPDATE pages
    SET editorial_sections_configured = true,
        updated_at = now()
    WHERE key IN ('about', 'warranty');

    -- about prose
    UPDATE pages
    SET stub_hero_lead = ${aboutLead},
        updated_at = now()
    WHERE key = 'about'
      AND ${heroLeadReplaceWhere(SEEDED_COPY.aboutHeroLead)};

    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT seeded.id, p.id, seeded.position, seeded.heading, seeded.body
    FROM pages AS p
    JOIN (VALUES
      ('about', 'about-customers', 0, '', ${aboutCustomersBody}),
      ('about', 'about-terms', 1, '', ${aboutTermsBody})
    ) AS seeded(page_key, id, position, heading, body) ON p.key::text = seeded.page_key
    ON CONFLICT (_parent_id, id) DO NOTHING;

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'about'
      AND feature.id = 'about-feature-1'
      AND text = ${sqlLiteral(SEEDED_COPY.aboutFeatureTexts["about-feature-1"])};

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'about'
      AND feature.id = 'about-feature-2'
      AND text = ${sqlLiteral(SEEDED_COPY.aboutFeatureTexts["about-feature-2"])};

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'about'
      AND feature.id = 'about-feature-3'
      AND text = ${sqlLiteral(SEEDED_COPY.aboutFeatureTexts["about-feature-3"])};

    -- warranty prose
    UPDATE pages
    SET stub_hero_lead = ${warrantyLead},
        updated_at = now()
    WHERE key = 'warranty'
      AND ${heroLeadReplaceWhere(SEEDED_COPY.warrantyHeroLead)};

    INSERT INTO pages_editorial_sections (id, _parent_id, _order, heading, body)
    SELECT seeded.id, p.id, seeded.position, seeded.heading, seeded.body
    FROM pages AS p
    JOIN (VALUES
      ('warranty', 'warranty-claim', 0, '', ${warrantyClaimBody}),
      ('warranty', 'warranty-review', 1, '', ${warrantyReviewBody}),
      ('warranty', 'warranty-exclusions', 2, '', ${warrantyExclusionsBody}),
      ('warranty', 'warranty-terms', 3, '', ${warrantyTermsBody})
    ) AS seeded(page_key, id, position, heading, body) ON p.key::text = seeded.page_key
    ON CONFLICT (_parent_id, id) DO NOTHING;

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'warranty'
      AND feature.id = 'warranty-feature-1'
      AND text = ${sqlLiteral(SEEDED_COPY.warrantyFeatureTexts["warranty-feature-1"])};

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'warranty'
      AND feature.id = 'warranty-feature-2'
      AND text = ${sqlLiteral(SEEDED_COPY.warrantyFeatureTexts["warranty-feature-2"])};

    DELETE FROM pages_editorial_features AS feature
    USING pages AS p
    WHERE feature._parent_id = p.id
      AND p.key = 'warranty'
      AND feature.id = 'warranty-feature-3'
      AND text = ${sqlLiteral(SEEDED_COPY.warrantyFeatureTexts["warranty-feature-3"])};
  `,
};
