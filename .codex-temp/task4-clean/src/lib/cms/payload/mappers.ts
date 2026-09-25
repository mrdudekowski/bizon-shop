import type {
  Media,
  PeopleStory,
  Product,
  ShopCategory,
  TireIqArticle,
  TireModel,
  TireType,
  TireVariant,
  WheelModel,
  WheelType,
  WheelVariant,
} from "@/payload-types";

import type {
  CmsArticle,
  CmsProduct,
  CmsShopCategory,
  CmsStory,
  CmsTireModel,
  CmsTireType,
  CmsTireVariant,
  CmsWheelModel,
  CmsWheelType,
  CmsWheelVariant,
} from "../types";
import { formatPublishedDate, isLexicalContent, lexicalToPlainText } from "./richText";
import { resolveMedia } from "../media";

const DEFAULT_BRAND = "DOUBLESTAR";

function mapImageUrl(media: Media | number | null | undefined): string | null {
  return resolveMedia(media, "card")?.url ?? null;
}

export function resolveRelationSlug(
  relation: number | { slug?: string | null } | null | undefined,
): string | null {
  if (relation && typeof relation === "object" && typeof relation.slug === "string") {
    return relation.slug;
  }
  return null;
}

function resolveRelationName(
  relation: number | { name?: string | null; slug?: string | null } | null | undefined,
): string {
  if (relation && typeof relation === "object") {
    if (typeof relation.name === "string" && relation.name.trim()) return relation.name.trim();
    if (typeof relation.slug === "string") return relation.slug;
  }
  return "";
}

export function mapProduct(doc: Product): CmsProduct {
  const categorySlug = resolveRelationSlug(doc.shopCategory) ?? "";
  const descriptionShort = doc.shortDescription?.trim() || doc.name;
  const descriptionLong =
    lexicalToPlainText(doc.fullDescription) || doc.shortDescription?.trim() || doc.name;
  const gallery = (doc.gallery ?? [])
    .map((media) => resolveMedia(media, "hero")?.url ?? null)
    .filter((url): url is string => Boolean(url));
  const variants = (doc.variants ?? []).map((variant, index) => ({
    id: variant.id ?? `${doc.id}-${index + 1}`,
    sku: variant.sku?.trim() || undefined,
    color: variant.color?.trim() || undefined,
    size: variant.size?.trim() || undefined,
    configuration: variant.configuration?.trim() || undefined,
    price: variant.price ?? undefined,
    oldPrice: variant.oldPrice ?? undefined,
    priceOnRequest: variant.priceOnRequest ?? true,
    available: variant.available ?? true,
    images: (variant.images ?? [])
      .map((media) => resolveMedia(media, "hero")?.url ?? null)
      .filter((url): url is string => Boolean(url)),
  }));

  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    categorySlug,
    type: categorySlug,
    brand: DEFAULT_BRAND,
    descriptionShort,
    descriptionLong,
    imageUrl: mapImageUrl(doc.mainImage),
    gallery,
    price: doc.price ?? undefined,
    oldPrice: doc.oldPrice ?? undefined,
    priceOnRequest: doc.priceOnRequest ?? true,
    available: doc.available ?? true,
    color: doc.color?.trim() || undefined,
    size: doc.size?.trim() || undefined,
    material: doc.material?.trim() || undefined,
    variants,
  };
}

export function mapTireType(doc: TireType): CmsTireType {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description?.trim() || doc.name,
    shortDescription: doc.shortDescription?.trim() || doc.description?.trim() || doc.name,
    sortOrder: doc.sortOrder ?? 0,
    showInMenu: doc.showInMenu ?? true,
    imageUrl: mapImageUrl(doc.coverImage),
    selectionVehicleTypes: doc.selectionVehicleTypes ?? [],
    selectionConditions: doc.selectionConditions ?? [],
  };
}

export function mapTireModelDetail(doc: TireModel): CmsTireModel {
  const tireTypeSlug = resolveRelationSlug(doc.tireType) ?? "";
  const applicationTypes = doc.applicationTypes ?? [];
  const positions = doc.positions ?? [];
  const descriptionShort =
    doc.shortDescription?.trim() ||
    applicationTypes.join(", ") ||
    doc.name;
  const descriptionLong =
    lexicalToPlainText(doc.fullDescription) || doc.shortDescription?.trim() || descriptionShort;
  const gallery = (doc.gallery ?? [])
    .map((media) => resolveMedia(media, "hero")?.url ?? null)
    .filter((url): url is string => Boolean(url));
  const advantages = (doc.features ?? []).map((feature) => ({
    key: feature.key,
    title: feature.title,
    description: feature.description?.trim() || undefined,
  }));
  const documents = (doc.documents ?? [])
    .map((item) => {
      const media = resolveMedia(item);
      if (!media) return null;
      return {
        url: media.url,
        title: media.title || media.filename || "Документ",
      };
    })
    .filter((item): item is { url: string; title: string } => Boolean(item));

  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    tireTypeSlug,
    tireTypeName: resolveRelationName(doc.tireType) || tireTypeSlug,
    applicationCategory: applicationTypes[0]?.replaceAll("-", "_") || tireTypeSlug,
    brand: DEFAULT_BRAND,
    descriptionShort,
    descriptionLong,
    application: applicationTypes.join(", ") || undefined,
    axlePosition: positions.join(", ") || undefined,
    imageUrl: mapImageUrl(doc.mainImage),
    gallery,
    advantages,
    documents,
    selectionVehicleTypes: [],
    selectionConditions: applicationTypes.filter(
      (application): application is "long-haul" | "regional" | "off-road" =>
        application === "long-haul" ||
        application === "regional" ||
        application === "off-road",
    ),
    selectionAxles: positions,
  };
}

export function mapTireVariant(doc: TireVariant): CmsTireVariant {
  const price = doc.price ?? undefined;

  return {
    id: String(doc.id),
    size: doc.sizeNormalized?.trim() || doc.sizeRaw?.trim() || "",
    rimDiameter: doc.rimDiameterIn ?? undefined,
    loadIndex: doc.loadIndexSingle != null ? String(doc.loadIndexSingle) : undefined,
    speedIndex: doc.speedSymbol ?? undefined,
    plyRating: doc.plyRatingPr != null ? String(doc.plyRatingPr) : undefined,
    overallDiameter: doc.overallDiameterMm ?? undefined,
    recommendedRim: doc.standardRimIn != null ? String(doc.standardRimIn) : undefined,
    available: doc.availabilityStatus !== "unavailable",
    price,
    priceOnRequest: price == null || doc.availabilityStatus !== "available",
  };
}

export function mapWheelType(doc: WheelType): CmsWheelType {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description?.trim() || doc.name,
    shortDescription: doc.shortDescription?.trim() || doc.description?.trim() || doc.name,
    sortOrder: doc.sortOrder ?? 0,
    imageUrl: mapImageUrl(doc.coverImage),
  };
}

export function mapWheelModelDetail(doc: WheelModel): CmsWheelModel {
  const wheelTypeSlug = resolveRelationSlug(doc.wheelType) ?? "";
  const descriptionShort = doc.shortDescription?.trim() || doc.name;
  const descriptionLong =
    lexicalToPlainText(doc.fullDescription) || doc.shortDescription?.trim() || descriptionShort;

  const documents =
    Array.isArray(doc.documents) && doc.documents.length > 0
      ? doc.documents
          .map((item) => {
            const media = resolveMedia(item);
            if (!media) return null;
            return { url: media.url, title: media.title || media.filename || "Документ" };
          })
          .filter((item): item is { url: string; title: string } => Boolean(item))
      : undefined;

  const gallery = (doc.gallery ?? [])
    .map((item) => {
      const media = resolveMedia(item, "hero");
      if (!media) return null;
      return {
        url: media.url,
        alt: media.alt || doc.name,
        label: (media.title || "").trim() || "View",
      };
    })
    .filter((item): item is { url: string; alt: string; label: string } => Boolean(item));

  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    wheelTypeSlug,
    wheelTypeName: resolveRelationName(doc.wheelType) || wheelTypeSlug,
    series: doc.series?.trim() || undefined,
    designStyle: doc.designStyle?.trim() || undefined,
    material: doc.material?.trim() || undefined,
    constructionMethod: doc.constructionMethod ?? undefined,
    fitmentNotes: doc.fitmentNotes?.trim() || undefined,
    descriptionShort,
    descriptionLong,
    documents,
    gallery,
    imageUrl: mapImageUrl(doc.mainImage),
  };
}

export function mapWheelVariant(doc: WheelVariant, modelId?: string): CmsWheelVariant {
  const resolvedModelId =
    modelId ??
    (typeof doc.wheelModel === "object" && doc.wheelModel != null
      ? String(doc.wheelModel.id)
      : String(doc.wheelModel));

  return {
    id: String(doc.id),
    modelId: resolvedModelId,
    sizeLabel: doc.sizeLabel,
    sku: doc.sku?.trim() || undefined,
    diameter: doc.diameter ?? undefined,
    width: doc.width ?? undefined,
    boltHoles: doc.boltHoles ?? undefined,
    pcd: doc.pcd?.trim() || undefined,
    offsetET: doc.offsetET ?? undefined,
    centerBore: doc.centerBore ?? undefined,
    loadRating: doc.loadRating?.trim() || undefined,
    weight: doc.weight ?? undefined,
    color: doc.color?.trim() || undefined,
    finish: doc.finish?.trim() || undefined,
    compatibleTireSizes: doc.compatibleTireSizes?.trim() || undefined,
    available: doc.available ?? true,
    price: doc.price ?? undefined,
    priceOnRequest: doc.priceOnRequest ?? true,
  };
}

export function mapShopCategory(doc: ShopCategory): CmsShopCategory {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description?.trim() || doc.name,
    imageUrl: mapImageUrl(doc.coverImage),
  };
}

function mapArticleBase(doc: {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  content?: unknown;
  featuredImage?: Media | number | null;
}): CmsArticle {
  const excerpt = doc.excerpt?.trim() || doc.title;
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt,
    publishedAt: formatPublishedDate(doc.publishedAt),
    content: isLexicalContent(doc.content) ? doc.content : null,
    imageUrl: mapImageUrl(doc.featuredImage),
  };
}

export function mapTireIQArticle(doc: TireIqArticle): CmsArticle {
  return mapArticleBase(doc);
}

export function mapPeopleStory(doc: PeopleStory): CmsStory {
  return {
    ...mapArticleBase(doc),
    clientName: doc.clientName?.trim() || undefined,
    industry: doc.industry?.trim() || undefined,
  };
}
