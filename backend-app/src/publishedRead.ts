import { mapArticle, type CmsArticle } from "./mapArticle";
import { mapHomePatch, type HomePatch } from "./mapPage";
import {
  mapTireModel,
  mapTireType,
  mapTireVariant,
  type CmsTireModel,
  type CmsTireType,
  type CmsTireVariant,
} from "./mapTire";

export type ReadDatabase = {
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
};

function readStringColumn(rows: Record<string, unknown>[], column: string): string[] {
  return rows.flatMap((row) => (typeof row[column] === "string" ? [row[column]] : []));
}

export async function readTireTypes(db: ReadDatabase): Promise<CmsTireType[]> {
  const tireTypeRows = await db.query(`
    SELECT tire_types.*, media.url AS image_url
    FROM tire_types
    LEFT JOIN media ON media.id = tire_types.cover_image_id
    WHERE tire_types.status = 'published'
    ORDER BY tire_types.sort_order, tire_types.id
  `);

  return Promise.all(
    tireTypeRows.map(async (tireTypeRow) => {
      const [vehicleTypeRows, conditionRows] = await Promise.all([
        db.query(
          "SELECT value FROM tire_types_selection_vehicle_types WHERE parent_id = $1",
          [tireTypeRow.id],
        ),
        db.query(
          "SELECT value FROM tire_types_selection_conditions WHERE parent_id = $1",
          [tireTypeRow.id],
        ),
      ]);

      return mapTireType(tireTypeRow as Parameters<typeof mapTireType>[0], {
        vehicleTypes: readStringColumn(vehicleTypeRows, "value"),
        conditions: readStringColumn(conditionRows, "value"),
      });
    }),
  );
}

export async function readTireModelsByType(
  db: ReadDatabase,
  typeSlug: string,
): Promise<CmsTireModel[]> {
  const modelRows = await db.query(
    `
      SELECT tire_models.*, tire_types.slug AS tire_type_slug, tire_types.name AS tire_type_name,
        media.url AS image_url
      FROM tire_models
      JOIN tire_types ON tire_types.id = tire_models.tire_type_id
      LEFT JOIN media ON media.id = tire_models.main_image_id
      WHERE tire_models.status = 'published'
        AND tire_types.status = 'published'
        AND tire_types.slug = $1
      ORDER BY tire_models.name, tire_models.id
    `,
    [typeSlug],
  );

  return Promise.all(
    modelRows.map(async (modelRow) => {
      const [axleRows, featureRows] = await Promise.all([
        db.query("SELECT value FROM tire_models_positions WHERE parent_id = $1", [modelRow.id]),
        db.query(
          `
            SELECT key, title, description
            FROM tire_models_features
            WHERE _parent_id = $1
            ORDER BY _order
          `,
          [modelRow.id],
        ),
      ]);

      return mapTireModel({
        row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
        tireType: {
          slug: modelRow.tire_type_slug as string,
          name: modelRow.tire_type_name as string,
        },
        imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
        gallery: [],
        advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
        selectionAxles: readStringColumn(axleRows, "value"),
      });
    }),
  );
}

export async function readTireModel(
  db: ReadDatabase,
  typeSlug: string,
  modelSlug: string,
): Promise<CmsTireModel | null> {
  const [modelRow] = await db.query(
    `
      SELECT tire_models.*, tire_types.slug AS tire_type_slug, tire_types.name AS tire_type_name,
        media.url AS image_url
      FROM tire_models
      JOIN tire_types ON tire_types.id = tire_models.tire_type_id
      LEFT JOIN media ON media.id = tire_models.main_image_id
      WHERE tire_models.status = 'published'
        AND tire_types.status = 'published'
        AND tire_types.slug = $1
        AND tire_models.slug = $2
    `,
    [typeSlug, modelSlug],
  );

  if (!modelRow) {
    return null;
  }

  const [axleRows, featureRows] = await Promise.all([
    db.query("SELECT value FROM tire_models_positions WHERE parent_id = $1", [modelRow.id]),
    db.query(
      `
        SELECT key, title, description
        FROM tire_models_features
        WHERE _parent_id = $1
        ORDER BY _order
      `,
      [modelRow.id],
    ),
  ]);

  return mapTireModel({
    row: modelRow as Parameters<typeof mapTireModel>[0]["row"],
    tireType: {
      slug: modelRow.tire_type_slug as string,
      name: modelRow.tire_type_name as string,
    },
    imageUrl: typeof modelRow.image_url === "string" ? modelRow.image_url : null,
    gallery: [],
    advantages: featureRows.map(({ key, title, description }) => ({ key, title, description })),
    selectionAxles: readStringColumn(axleRows, "value"),
  });
}

export async function readTireVariants(
  db: ReadDatabase,
  modelId: string | number,
): Promise<CmsTireVariant[]> {
  const variantRows = await db.query(
    `
      SELECT *
      FROM tire_variants
      WHERE tire_model_id = $1 AND status = 'published'
      ORDER BY sort_order, id
    `,
    [modelId],
  );

  return variantRows.map((variantRow) =>
    mapTireVariant(variantRow as Parameters<typeof mapTireVariant>[0]),
  );
}

export async function readHomePatch(db: ReadDatabase): Promise<HomePatch | null> {
  const [homeRow] = await db.query(`
    SELECT seo_seo_title, seo_seo_description, home_hero_eyebrow, home_hero_title, home_hero_lead,
      home_hero_primary_cta_label, home_hero_primary_cta_href, home_hero_secondary_cta_label,
      home_hero_secondary_cta_href, home_hero_metric_label, home_hero_metric_text
    FROM pages
    WHERE key = 'home' AND status = 'published'
  `);

  return homeRow ? mapHomePatch(homeRow as Parameters<typeof mapHomePatch>[0]) : null;
}

export async function readArticles(db: ReadDatabase): Promise<CmsArticle[]> {
  const articleRows = await db.query(`
    SELECT tire_iq_articles.*, media.url AS image_url
    FROM tire_iq_articles
    LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
    WHERE tire_iq_articles.status = 'published'
  `);

  return articleRows.map((articleRow) => mapArticle(articleRow as Parameters<typeof mapArticle>[0]));
}

export async function readArticleBySlug(
  db: ReadDatabase,
  slug: string,
): Promise<CmsArticle | null> {
  const [articleRow] = await db.query(
    `
      SELECT tire_iq_articles.*, media.url AS image_url
      FROM tire_iq_articles
      LEFT JOIN media ON media.id = tire_iq_articles.featured_image_id
      WHERE tire_iq_articles.status = 'published' AND tire_iq_articles.slug = $1
    `,
    [slug],
  );

  return articleRow ? mapArticle(articleRow as Parameters<typeof mapArticle>[0]) : null;
}
