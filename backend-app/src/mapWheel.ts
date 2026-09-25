import { lexicalToHtml, normalizeImageUrl, toFiniteNumber } from "./mapTire";

type WheelTypeRow = {
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  sort_order: unknown;
  image_url: string | null;
};

type WheelModelRow = {
  id: string | number;
  name: string;
  slug: string;
  series: string | null;
  design_style: string | null;
  material: string | null;
  construction_method: string | null;
  fitment_notes: string | null;
  short_description: string | null;
  full_description: unknown;
  show_in_menu: boolean | null;
  menu_order: unknown;
  wheel_type_slug: string;
  wheel_type_name: string;
};

export type CmsWheelGalleryImage = {
  url: string;
  alt: string;
  label: string;
};

export type CmsWheelType = {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  sortOrder: number;
  imageUrl: string | null;
};

export type CmsWheelModel = {
  id: string;
  slug: string;
  name: string;
  wheelTypeSlug: string;
  wheelTypeName: string;
  series?: string;
  designStyle?: string;
  material?: string;
  constructionMethod?: string;
  fitmentNotes?: string;
  descriptionShort: string;
  descriptionLong: string;
  imageUrl: string | null;
  gallery: CmsWheelGalleryImage[];
  showInMenu: boolean;
  menuOrder: number;
};

export type CmsWheelVariant = {
  id: string;
  modelId: string;
  sizeLabel: string;
  sku?: string;
  diameter?: number;
  width?: number;
  boltHoles?: number;
  pcd?: string;
  pcdMm?: number;
  offsetET?: number;
  centerBore?: number;
  loadRating?: string;
  weight?: number;
  color?: string;
  finish?: string;
  fastenerType?: string;
  fastenerMaterial?: string;
  sourceSpecification?: string;
  compatibleTireSizes?: string;
  available: boolean;
  price?: number;
  priceOnRequest: boolean;
};

type WheelVariantRow = {
  id: string | number;
  wheel_model_id: string | number;
  size_label: string | null;
  sku: string | null;
  diameter: unknown;
  width: unknown;
  bolt_holes: unknown;
  pcd: string | null;
  pcd_mm: unknown;
  offset_e_t: unknown;
  center_bore: unknown;
  load_rating: string | null;
  weight: unknown;
  color: string | null;
  finish: string | null;
  fastener_type: string | null;
  fastener_material: string | null;
  source_specification: string | null;
  compatible_tire_sizes: string | null;
  available: boolean | null;
  price: unknown;
  price_on_request: boolean | null;
};

function optionalText(value: string | null | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

function sortOrder(value: unknown): number {
  const parsed = toFiniteNumber(value);
  return parsed ?? 0;
}

export function mapWheelType(row: WheelTypeRow): CmsWheelType {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",
    sortOrder: sortOrder(row.sort_order),
    imageUrl: normalizeImageUrl(row.image_url),
  };
}

export function mapWheelGallery(
  rows: { image_url?: unknown; image_alt?: unknown }[],
): CmsWheelGalleryImage[] {
  return rows.flatMap((row) => {
    const url = normalizeImageUrl(typeof row.image_url === "string" ? row.image_url : null);
    if (!url) return [];
    const alt = typeof row.image_alt === "string" ? row.image_alt : "";
    return [{ url, alt, label: alt }];
  });
}

export function mapWheelModel(
  row: WheelModelRow,
  imageUrl: string | null | undefined,
  gallery: CmsWheelGalleryImage[],
): CmsWheelModel {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    wheelTypeSlug: row.wheel_type_slug,
    wheelTypeName: row.wheel_type_name,
    ...(optionalText(row.series) ? { series: row.series ?? undefined } : {}),
    ...(optionalText(row.design_style) ? { designStyle: row.design_style ?? undefined } : {}),
    ...(optionalText(row.material) ? { material: row.material ?? undefined } : {}),
    ...(optionalText(row.construction_method)
      ? { constructionMethod: row.construction_method ?? undefined }
      : {}),
    ...(optionalText(row.fitment_notes) ? { fitmentNotes: row.fitment_notes ?? undefined } : {}),
    descriptionShort: row.short_description ?? "",
    descriptionLong: lexicalToHtml(row.full_description),
    imageUrl: normalizeImageUrl(imageUrl),
    gallery,
    showInMenu: row.show_in_menu === true,
    menuOrder: sortOrder(row.menu_order),
  };
}

export function mapWheelVariant(row: WheelVariantRow): CmsWheelVariant {
  const price = toFiniteNumber(row.price);
  const numericSpecs = {
    diameter: toFiniteNumber(row.diameter),
    width: toFiniteNumber(row.width),
    boltHoles: toFiniteNumber(row.bolt_holes),
    pcdMm: toFiniteNumber(row.pcd_mm),
    offsetET: toFiniteNumber(row.offset_e_t),
    centerBore: toFiniteNumber(row.center_bore),
    weight: toFiniteNumber(row.weight),
  };

  return {
    id: String(row.id),
    modelId: String(row.wheel_model_id),
    sizeLabel: row.size_label ?? "",
    ...(optionalText(row.sku) ? { sku: row.sku ?? undefined } : {}),
    ...(optionalText(row.pcd) ? { pcd: row.pcd ?? undefined } : {}),
    ...(optionalText(row.load_rating) ? { loadRating: row.load_rating ?? undefined } : {}),
    ...(optionalText(row.color) ? { color: row.color ?? undefined } : {}),
    ...(optionalText(row.finish) ? { finish: row.finish ?? undefined } : {}),
    ...(optionalText(row.fastener_type) ? { fastenerType: row.fastener_type ?? undefined } : {}),
    ...(optionalText(row.fastener_material)
      ? { fastenerMaterial: row.fastener_material ?? undefined }
      : {}),
    ...(optionalText(row.source_specification)
      ? { sourceSpecification: row.source_specification ?? undefined }
      : {}),
    ...(optionalText(row.compatible_tire_sizes)
      ? { compatibleTireSizes: row.compatible_tire_sizes ?? undefined }
      : {}),
    available: row.available !== false,
    ...(price !== undefined ? { price } : {}),
    priceOnRequest: price === undefined || row.price_on_request === true,
    ...Object.fromEntries(Object.entries(numericSpecs).filter(([, value]) => value !== undefined)),
  };
}
