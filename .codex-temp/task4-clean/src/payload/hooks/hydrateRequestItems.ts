import type { CollectionBeforeChangeHook } from "payload";

import {
  itemTypeFromRelation,
  parsePolymorphicRef,
  relationName,
  relationSlug,
  type CatalogItemRelation,
} from "@/lib/requests/requestCatalogItem";

type PayloadReq = Parameters<CollectionBeforeChangeHook>[0]["req"];

async function loadDoc(
  req: PayloadReq,
  collection: string,
  id: number | string,
  depth: number,
): Promise<Record<string, unknown>> {
  const doc = await req.payload.findByID({
    collection: collection as never,
    id,
    depth,
  });
  return doc as unknown as Record<string, unknown>;
}

async function resolveParentSlug(
  req: PayloadReq,
  relationTo: CatalogItemRelation,
  doc: Record<string, unknown>,
): Promise<string | undefined> {
  if (relationTo === "tire-models") {
    const tireType = doc.tireType;
    const slug = relationSlug(tireType);
    if (slug) return slug;
    const id =
      typeof tireType === "number"
        ? tireType
        : typeof tireType === "object" && tireType && "id" in tireType
          ? (tireType as { id: number | string }).id
          : undefined;
    if (id == null) return undefined;
    const typeDoc = await loadDoc(req, "tire-types", id, 0);
    return relationSlug(typeDoc);
  }

  if (relationTo === "wheel-models") {
    const wheelType = doc.wheelType;
    const slug = relationSlug(wheelType);
    if (slug) return slug;
    const id =
      typeof wheelType === "number"
        ? wheelType
        : typeof wheelType === "object" && wheelType && "id" in wheelType
          ? (wheelType as { id: number | string }).id
          : undefined;
    if (id == null) return undefined;
    const typeDoc = await loadDoc(req, "wheel-types", id, 0);
    return relationSlug(typeDoc);
  }

  if (relationTo === "products") {
    const shopCategory = doc.shopCategory;
    const slug = relationSlug(shopCategory);
    if (slug) return slug;
    const id =
      typeof shopCategory === "number"
        ? shopCategory
        : typeof shopCategory === "object" && shopCategory && "id" in shopCategory
          ? (shopCategory as { id: number | string }).id
          : undefined;
    if (id == null) return undefined;
    const categoryDoc = await loadDoc(req, "shop-categories", id, 0);
    return relationSlug(categoryDoc);
  }

  return undefined;
}

export const hydrateRequestItems: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!Array.isArray(data?.items)) return data;

  for (const item of data.items) {
    if (!item || typeof item !== "object") continue;

    const catalogItem = parsePolymorphicRef(item.catalogItem);
    if (catalogItem) {
      const itemType = itemTypeFromRelation(catalogItem.relationTo);
      if (itemType) item.itemType = itemType;

      const modelDoc =
        catalogItem.doc ??
        (await loadDoc(req, catalogItem.relationTo, catalogItem.id, 1));

      item.itemName = relationName(modelDoc, item.itemName) ?? item.itemName;
      item.itemSlug = relationSlug(modelDoc) ?? item.itemSlug;
      item.parentSlug =
        (await resolveParentSlug(req, catalogItem.relationTo as CatalogItemRelation, modelDoc)) ??
        item.parentSlug;
    }

    const catalogVariant = parsePolymorphicRef(item.catalogVariant);
    if (catalogVariant) {
      const variantDoc =
        catalogVariant.doc ??
        (await loadDoc(req, catalogVariant.relationTo, catalogVariant.id, 0));

      item.variantLabel =
        relationName(variantDoc, item.variantLabel) ?? item.variantLabel ?? item.itemName;
    }
  }

  return data;
};
