import type {
  PublishBlocker,
  ShopProductDraft,
  TireDirectionDraft,
  TireModelDraft,
  WheelModelDraft,
  WheelTypeDraft,
} from "./types";

function hasPrice(size: TireModelDraft["sizes"][number]): boolean {
  return size.priceOnRequest || typeof size.price === "number";
}

export function tireModelPublishBlockers(model: TireModelDraft): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];
  if (model.name.trim().length === 0) blockers.push("name");
  if (model.slug.trim().length === 0) blockers.push("slug");
  if (model.directionId.trim().length === 0) blockers.push("direction");
  if (model.mainImage == null) blockers.push("mainImage");
  if (model.sizes.some((size) => size.size.trim().length === 0)) blockers.push("size");
  if (model.sizes.some((size) => !hasPrice(size))) blockers.push("price");

  const seen = new Set<string>();
  for (const size of model.sizes) {
    const key = size.size.trim().toLowerCase();
    if (key.length === 0) continue;
    if (seen.has(key)) {
      blockers.push("duplicateSize");
      break;
    }
    seen.add(key);
  }
  return blockers;
}

function identityBlockers(input: { name: string; slug: string; mainImage?: unknown }): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];
  if (input.name.trim().length === 0) blockers.push("name");
  if (input.slug.trim().length === 0) blockers.push("slug");
  if (input.mainImage == null) blockers.push("mainImage");
  return blockers;
}

export function wheelTypePublishBlockers(draft: WheelTypeDraft): PublishBlocker[] {
  return identityBlockers(draft);
}

export function tireDirectionPublishBlockers(draft: TireDirectionDraft): PublishBlocker[] {
  return identityBlockers(draft);
}

export function wheelModelPublishBlockers(model: WheelModelDraft): PublishBlocker[] {
  const blockers = identityBlockers(model);
  if (model.wheelTypeId.trim().length === 0) blockers.push("direction");
  if (model.variants.some((variant) => variant.sizeLabel.trim().length === 0)) blockers.push("size");
  if (model.variants.some((variant) => !variant.priceOnRequest && typeof variant.price !== "number")) {
    blockers.push("price");
  }
  return blockers;
}

export function shopProductPublishBlockers(product: ShopProductDraft): PublishBlocker[] {
  const blockers = identityBlockers(product);
  if (product.categoryId.trim().length === 0) blockers.push("direction");
  if (!product.priceOnRequest && typeof product.price !== "number") blockers.push("price");
  if (product.variants.some((variant) => variant.size.trim().length === 0)) blockers.push("size");
  return blockers;
}

export function articlePublishBlockers(draft: { title: string; slug: string; body: string }): string[] {
  const blockers: string[] = [];
  if (draft.title.trim().length === 0) blockers.push("title");
  if (draft.slug.trim().length === 0) blockers.push("slug");
  if (draft.body.trim().length === 0) blockers.push("body");
  return blockers;
}
