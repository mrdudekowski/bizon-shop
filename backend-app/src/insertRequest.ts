import { randomUUID } from "node:crypto";

import type { ReadDatabase } from "./publishedRead";

const SOURCE_FORMS = new Set([
  "contact",
  "tire_selection",
  "branding",
  "supplier",
  "warranty",
  "wheel_selection",
  "product_quick_order",
  "cart",
  "hero_cta",
  "footer_cta",
  "custom",
]);

type RequestItemInput = {
  itemType?: string;
  tireModel?: number;
  tireVariant?: number;
  wheelModel?: number;
  wheelVariant?: number;
  product?: number;
  itemName?: string;
  itemSlug?: string;
  parentSlug?: string;
  variantLabel?: string;
  quantity?: number;
  url?: string;
  notes?: string;
  priceOnRequest?: boolean;
};

export type StoredRequestInput = {
  clientType?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  companyName?: string;
  inn?: string;
  position?: string;
  purchaseVolume?: string;
  preferredContact?: string;
  message?: string;
  selectionContext?: unknown;
  items?: RequestItemInput[];
  sourcePage?: string;
  sourceForm?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  sourceIpHash?: string;
  userAgent?: string;
};

const RELATION_COLUMN = {
  "tire-models": "tire_models_id",
  "wheel-models": "wheel_models_id",
  products: "products_id",
  "tire-variants": "tire_variants_id",
  "wheel-variants": "wheel_variants_id",
} as const;

function sourceForm(value: string | undefined): string {
  return value && SOURCE_FORMS.has(value) ? value : "custom";
}

function catalogRelation(item: RequestItemInput): { relation: keyof typeof RELATION_COLUMN; id: number } | null {
  if (item.itemType === "tire" && item.tireModel != null) {
    return { relation: "tire-models", id: item.tireModel };
  }
  if (item.itemType === "wheel" && item.wheelModel != null) {
    return { relation: "wheel-models", id: item.wheelModel };
  }
  if (item.itemType === "shopProduct" && item.product != null) {
    return { relation: "products", id: item.product };
  }
  return null;
}

function variantRelation(item: RequestItemInput): { relation: keyof typeof RELATION_COLUMN; id: number } | null {
  if (item.tireVariant != null) return { relation: "tire-variants", id: item.tireVariant };
  if (item.wheelVariant != null) return { relation: "wheel-variants", id: item.wheelVariant };
  return null;
}

async function insertRelation(
  db: ReadDatabase,
  requestId: number,
  order: number,
  path: string,
  relation: keyof typeof RELATION_COLUMN,
  id: number,
) {
  const column = RELATION_COLUMN[relation];
  await db.query(
    `INSERT INTO requests_rels (parent_id, path, "order", ${column}) VALUES ($1, $2, $3, $4)`,
    [requestId, path, order, id],
  );
}

export async function insertRequest(db: ReadDatabase, input: StoredRequestInput): Promise<number> {
  const [row] = await db.query(
    `INSERT INTO requests (
      client_type, name, phone, email, city, company_name, inn, position, purchase_volume,
      preferred_contact, message, selection_context, source_page, source_form,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      source_ip_hash, user_agent, status, notification_status, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,
      'new','pending', now(), now()
    ) RETURNING id`,
    [
      input.clientType === "company" ? "company" : "individual",
      input.name ?? "",
      input.phone ?? null,
      input.email ?? null,
      input.city ?? null,
      input.companyName ?? null,
      input.inn ?? null,
      input.position ?? null,
      input.purchaseVolume ?? null,
      input.preferredContact ?? null,
      input.message ?? null,
      input.selectionContext == null ? null : JSON.stringify(input.selectionContext),
      input.sourcePage ?? null,
      sourceForm(input.sourceForm),
      input.utmSource ?? null,
      input.utmMedium ?? null,
      input.utmCampaign ?? null,
      input.utmContent ?? null,
      input.utmTerm ?? null,
      input.sourceIpHash ?? null,
      input.userAgent ?? null,
    ],
  );
  const requestId = Number(row?.id);
  const items = input.items ?? [];
  for (const [index, item] of items.entries()) {
    await db.query(
      `INSERT INTO requests_items (
        _order, _parent_id, id, item_type, item_name, item_slug, parent_slug, variant_label,
        quantity, url, notes, price_on_request
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        index,
        requestId,
        randomUUID(),
        item.itemType === "tire" || item.itemType === "wheel" || item.itemType === "shopProduct"
          ? item.itemType
          : "shopProduct",
        item.itemName ?? "",
        item.itemSlug ?? null,
        item.parentSlug ?? null,
        item.variantLabel ?? null,
        item.quantity ?? 1,
        item.url ?? null,
        item.notes ?? null,
        item.priceOnRequest === true,
      ],
    );
    const catalog = catalogRelation(item);
    if (catalog) {
      await insertRelation(db, requestId, index, "items.catalogItem", catalog.relation, catalog.id);
    }
    const variant = variantRelation(item);
    if (variant) {
      await insertRelation(db, requestId, index, "items.catalogVariant", variant.relation, variant.id);
    }
  }
  return requestId;
}
