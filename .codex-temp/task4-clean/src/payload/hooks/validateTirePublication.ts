import {
  validateModelPublication,
  validateVariantPublication,
  type ValidationWarning,
} from "@/lib/catalog/domain/tireValidation";
import { APIError } from "payload";
import type { CollectionBeforeChangeHook } from "payload";

type CatalogData = Record<string, unknown>;

type ModelWorkflowInput = {
  data: CatalogData;
  original?: CatalogData | null;
};

type VariantWorkflowInput = ModelWorkflowInput & {
  model?: CatalogData | null;
  hasDuplicateSku?: boolean;
};

function criticalMessages(warnings: ValidationWarning[]): string {
  return warnings
    .filter((warning) => warning.severity === "critical")
    .map((warning) => warning.message)
    .join("; ");
}

function publicationStatus(
  data: CatalogData,
  original?: CatalogData | null,
): unknown {
  return data.status !== undefined ? data.status : original?.status;
}

/**
 * Publish gates run only when the resulting status is `published`.
 * Returns `data` (not a full merge) so beforeChange does not rewrite unrelated fields.
 */
export function enforceTireModelWorkflowData(
  input: ModelWorkflowInput,
): CatalogData {
  const data = input.data ?? {};
  if (publicationStatus(data, input.original) !== "published") return data;

  const merged = { ...(input.original ?? {}), ...data };
  const validation = validateModelPublication({
    name: merged.name as string | null | undefined,
    slug: merged.slug as string | null | undefined,
    tireType: relationId(merged.tireType),
    mainImage: relationId(merged.mainImage),
  });
  if (!validation.canPublish) {
    throw new APIError(criticalMessages(validation.warnings), 400);
  }
  return data;
}

export function enforceTireVariantWorkflowData(
  input: VariantWorkflowInput,
): CatalogData {
  const data = input.data ?? {};
  if (publicationStatus(data, input.original) !== "published") return data;

  const merged = { ...(input.original ?? {}), ...data };
  const validation = validateVariantPublication({
    sku: merged.sku as string | null | undefined,
    tireModel: relationId(merged.tireModel),
    parsedSize:
      typeof merged.sizeNormalized === "string" &&
      merged.sizeNormalized.trim().length > 0,
    sizeNormalized: merged.sizeNormalized as string | null | undefined,
    model: input.model
      ? {
          status: input.model.status as
            | "draft"
            | "published"
            | "archived"
            | null
            | undefined,
        }
      : null,
    hasDuplicateSku: input.hasDuplicateSku,
  });
  if (!validation.canPublish) {
    throw new APIError(criticalMessages(validation.warnings), 400);
  }
  return data;
}

type PayloadHookRequest = Parameters<CollectionBeforeChangeHook>[0]["req"];

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

function relatedDocument(value: unknown): CatalogData | null {
  return value && typeof value === "object" && "status" in value
    ? (value as CatalogData)
    : null;
}

async function skuExists(
  req: PayloadHookRequest,
  sku: unknown,
  currentId: unknown,
): Promise<boolean> {
  if (typeof sku !== "string" || !sku.trim()) return false;

  const and: CatalogData[] = [{ sku: { equals: sku } }];
  if (typeof currentId === "string" || typeof currentId === "number") {
    and.push({ id: { not_equals: currentId } });
  }
  const result = await req.payload.find({
    collection: "tire-variants",
    where: { and },
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
  } as Parameters<typeof req.payload.find>[0]);
  return result.docs.length > 0;
}

export const validateTireModelPublication: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) =>
  enforceTireModelWorkflowData({
    data: data ?? {},
    original: (originalDoc as CatalogData | null | undefined) ?? null,
  });

export const validateTireVariantPublication: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const original = (originalDoc as CatalogData | null | undefined) ?? {};
  const incoming = data ?? {};
  if (publicationStatus(incoming, original) !== "published") return incoming;

  const merged = { ...original, ...incoming };
  const modelRelation = merged.tireModel;
  const modelId = relationId(modelRelation);
  const model =
    relatedDocument(modelRelation) ??
    (modelId == null
      ? null
      : ((await req.payload.findByID({
          collection: "tire-models",
          id: modelId,
          depth: 0,
          overrideAccess: true,
          req,
        })) as unknown as CatalogData));

  return enforceTireVariantWorkflowData({
    data: incoming,
    original,
    model,
    hasDuplicateSku: await skuExists(req, merged.sku, original.id),
  });
};
