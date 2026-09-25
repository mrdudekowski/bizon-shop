import { normalizeCatalogIdentity } from "@/lib/catalog/domain/tireCatalog";
import { parseTireSize } from "@/lib/catalog/domain/parseTireSize";
import {
  buildModelCodeFromSlug,
  buildTireVariantSku,
} from "@/lib/catalog/identity";
import type { CollectionBeforeValidateHook } from "payload";

export type TireCatalogData = Record<string, unknown>;

export function normalizeTireModelData(
  data: TireCatalogData,
): TireCatalogData {
  const normalized = normalizeIdentities(data, ["modelCode"]);
  if (isBlank(normalized.modelCode) && !isBlank(normalized.slug)) {
    normalized.modelCode = buildModelCodeFromSlug(String(normalized.slug));
  }
  return normalized;
}

function normalizeIdentities(
  data: TireCatalogData,
  fields: readonly string[],
): TireCatalogData {
  const normalized = { ...data };
  for (const field of fields) {
    const value = normalized[field];
    if (typeof value !== "string") continue;
    normalized[field] = value.trim()
      ? normalizeCatalogIdentity(value)
      : "";
  }
  return normalized;
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function parsedSizeFields(
  value: Extract<ReturnType<typeof parseTireSize>, { ok: true }>["value"],
): TireCatalogData {
  if (value.sizeFormat === "metric") {
    return {
      ...value,
      imperialWidthIn: null,
    };
  }
  return {
    ...value,
    nominalWidthMm: null,
    aspectRatioPct: null,
  };
}

const clearedParsedSizeFields = {
  sizeNormalized: null,
  sizeFormat: null,
  nominalWidthMm: null,
  aspectRatioPct: null,
  imperialWidthIn: null,
  constructionCode: null,
  rimDiameterIn: null,
};

function relatedModelCode(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "modelCode" in value &&
    typeof value.modelCode === "string" &&
    value.modelCode.trim()
  ) {
    return value.modelCode;
  }
  return null;
}

export function normalizeTireVariantData(input: {
  data: TireCatalogData;
  original?: TireCatalogData | null;
  resolvedModelCode?: string | null;
}): TireCatalogData {
  const original = input.original ?? {};
  const merged = normalizeIdentities(
    { ...original, ...input.data },
    ["sku", "supplierSku"],
  );
  if (Object.prototype.hasOwnProperty.call(input.data, "sizeRaw")) {
    const raw = typeof input.data.sizeRaw === "string" ? input.data.sizeRaw : "";
    const parseResult = parseTireSize(raw);
    Object.assign(
      merged,
      parseResult.ok
        ? parsedSizeFields(parseResult.value)
        : clearedParsedSizeFields,
    );
  }

  if (isBlank(merged.sku) && !isBlank(merged.sizeNormalized)) {
    const modelCode =
      input.resolvedModelCode ??
      relatedModelCode(merged.tireModel) ??
      relatedModelCode(original.tireModel) ??
      "MODEL";
    merged.sku = buildTireVariantSku(
      modelCode,
      String(merged.sizeNormalized),
    );
  }
  return merged;
}

export const normalizeTireModel: CollectionBeforeValidateHook = ({
  data,
}) => normalizeTireModelData(data ?? {});

function relationId(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    (typeof value.id === "string" || typeof value.id === "number")
  ) {
    return value.id;
  }
  return null;
}

export const normalizeTireVariant: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const original =
    (originalDoc as TireCatalogData | null | undefined) ?? null;
  const incoming = data ?? {};
  const modelRelation = incoming.tireModel ?? original?.tireModel;
  const modelId = relationId(modelRelation);
  const needsModelCode =
    isBlank(incoming.sku ?? original?.sku) &&
    relatedModelCode(modelRelation) == null &&
    modelId != null;
  const resolvedModel = needsModelCode
    ? await req.payload.findByID({
        collection: "tire-models",
        id: modelId,
        depth: 0,
        overrideAccess: true,
        req,
      })
    : null;
  const resolvedModelCode =
    relatedModelCode(resolvedModel) ??
    (resolvedModel &&
    typeof resolvedModel === "object" &&
    "slug" in resolvedModel &&
    typeof resolvedModel.slug === "string" &&
    resolvedModel.slug.trim()
      ? buildModelCodeFromSlug(resolvedModel.slug)
      : null);

  return normalizeTireVariantData({
    data: { ...incoming, tireModel: modelRelation },
    original,
    resolvedModelCode,
  });
};
