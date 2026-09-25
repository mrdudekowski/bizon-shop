import type { RequestItemType } from "@/types/requestItem";

import type { NormalizedRequestItem } from "./types";

export const CATALOG_ITEM_RELATIONS = ["tire-models", "wheel-models", "products"] as const;
export const CATALOG_VARIANT_RELATIONS = ["tire-variants", "wheel-variants"] as const;

export type CatalogItemRelation = (typeof CATALOG_ITEM_RELATIONS)[number];
export type CatalogVariantRelation = (typeof CATALOG_VARIANT_RELATIONS)[number];

export type PolymorphicRef = {
  relationTo: string;
  id: number | string;
  doc: Record<string, unknown> | null;
};

export function itemTypeFromRelation(relationTo: string): RequestItemType | undefined {
  if (relationTo === "tire-models") return "tire";
  if (relationTo === "wheel-models") return "wheel";
  if (relationTo === "products") return "shopProduct";
  return undefined;
}

export function parsePolymorphicRef(value: unknown): PolymorphicRef | null {
  if (value == null || value === "") return null;

  if (typeof value === "object" && value !== null && "relationTo" in value && "value" in value) {
    const relationTo = (value as { relationTo: unknown }).relationTo;
    const storedValue = (value as { value: unknown }).value;

    if (typeof relationTo !== "string" || storedValue == null) return null;

    if (typeof storedValue === "object" && storedValue !== null && "id" in storedValue) {
      const doc = storedValue as Record<string, unknown> & { id: number | string };
      return { relationTo, id: doc.id, doc: storedValue as Record<string, unknown> };
    }

    return { relationTo, id: storedValue as number | string, doc: null };
  }

  return null;
}

export function toCatalogItemRelation(item: NormalizedRequestItem) {
  if (item.itemType === "tire" && item.tireModel != null) {
    return { relationTo: "tire-models" as const, value: item.tireModel };
  }
  if (item.itemType === "wheel" && item.wheelModel != null) {
    return { relationTo: "wheel-models" as const, value: item.wheelModel };
  }
  if (item.itemType === "shopProduct" && item.product != null) {
    return { relationTo: "products" as const, value: item.product };
  }
  return undefined;
}

export function toCatalogVariantRelation(item: NormalizedRequestItem) {
  if (item.tireVariant != null) {
    return { relationTo: "tire-variants" as const, value: item.tireVariant };
  }
  if (item.wheelVariant != null) {
    return { relationTo: "wheel-variants" as const, value: item.wheelVariant };
  }
  return undefined;
}

export function relationSlug(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "object" && value !== null && "slug" in value) {
    const slug = (value as { slug: unknown }).slug;
    return typeof slug === "string" ? slug : undefined;
  }
  return undefined;
}

export function relationName(value: unknown, fallback?: string): string | undefined {
  if (typeof value === "object" && value !== null) {
    for (const key of ["name", "title", "size", "sizeLabel"] as const) {
      const candidate = (value as Record<string, unknown>)[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
  }
  return fallback;
}

/** ponytail: runnable self-check for API → Payload polymorphic mapping */
export function requestCatalogItemSelfCheck(): void {
  const tire = toCatalogItemRelation({
    itemType: "tire",
    tireModel: 10,
    itemName: "DSR158",
    quantity: 1,
    priceOnRequest: true,
  });
  if (tire?.relationTo !== "tire-models" || tire.value !== 10) {
    throw new Error("requestCatalogItemSelfCheck: tire model mapping failed");
  }

  const variant = toCatalogVariantRelation({
    itemType: "tire",
    tireVariant: 20,
    itemName: "DSR158",
    quantity: 1,
    priceOnRequest: true,
  });
  if (variant?.relationTo !== "tire-variants" || variant.value !== 20) {
    throw new Error("requestCatalogItemSelfCheck: tire variant mapping failed");
  }
}

if (process.env.NODE_ENV !== "production") {
  requestCatalogItemSelfCheck();
}
