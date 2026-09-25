type TireModelRow = {
  id: string | number;
  name: string;
  slug: string;
  short_description: string;
  full_description: unknown;
  series: string | null;
  tread_type: string | null;
};

type TireTypeReference = {
  slug: string;
  name: string;
};

type TireModelInput = {
  row: TireModelRow;
  tireType: TireTypeReference;
  imageUrl?: string | null;
  gallery: unknown[];
  advantages: unknown[];
  selectionAxles?: string[];
};

type TireTypeRow = {
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  sort_order: number;
  show_in_menu: boolean;
  image_url: string | null;
};

type TireTypeSelection = {
  vehicleTypes: string[];
  conditions: string[];
};

type TireVariantRow = {
  id: string | number;
  size: string;
  price: unknown;
  price_on_request: boolean;
  available: boolean;
  rim_diameter?: number;
  load_index?: number;
  load_index_dual?: number;
  speed_index?: number;
  ply_rating?: number;
  overall_diameter?: number;
  section_width?: number;
  tread_depth_mm?: number;
  pressure_single_kpa?: number;
  pressure_dual_kpa?: number;
  max_load_single_kg?: number;
  max_load_dual_kg?: number;
  recommended_rim?: number;
};

export type CmsTireType = {
  name: string;
  slug: string;
  description: string | null;
  descriptionShort: string | null;
  sortOrder: number;
  showInMenu: boolean;
  imageUrl: string | null;
  vehicleTypes: string[];
  conditions: string[];
};

export type CmsTireModel = {
  id: string;
  name: string;
  slug: string;
  tireTypeSlug: string;
  tireTypeName: string;
  brand: string;
  treadType: string;
  descriptionShort: string;
  descriptionLong: string;
  imageUrl: string | null;
  gallery: unknown[];
  advantages: unknown[];
  selectionAxles: string[];
};

export type CmsTireVariant = {
  id: string;
  size: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
  rimDiameter?: number;
  loadIndex?: number;
  loadIndexDual?: number;
  speedIndex?: number;
  plyRating?: number;
  overallDiameter?: number;
  sectionWidth?: number;
  treadDepth?: number;
  pressureSingleKpa?: number;
  pressureDualKpa?: number;
  maxLoadSingleKg?: number;
  maxLoadDualKg?: number;
  recommendedRim?: number;
};

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function collectLexicalText(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const node = value as { text?: unknown; children?: unknown };
  const text = typeof node.text === "string" ? [node.text] : [];
  const nestedValues = Array.isArray(node.children)
    ? node.children
    : Object.entries(node)
        .filter(([key]) => key !== "text")
        .map(([, child]) => child);
  const children = nestedValues.flatMap((child) => collectLexicalText(child));

  return [...text, ...children];
}

export function lexicalToHtml(value: unknown): string {
  if (typeof value === "string") {
    if (!value) {
      return "";
    }

    return value.includes("<p") || value.includes("<br") ? value : `<p>${escapeHtml(value)}</p>`;
  }

  const text = collectLexicalText(value).join("");
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

export function mapTireType(row: TireTypeRow, selection: TireTypeSelection): CmsTireType {
  return {
    name: row.name,
    slug: row.slug,
    description: row.description,
    descriptionShort: row.short_description,
    sortOrder: row.sort_order,
    showInMenu: row.show_in_menu,
    imageUrl: normalizeImageUrl(row.image_url),
    vehicleTypes: selection.vehicleTypes,
    conditions: selection.conditions,
  };
}

export function mapTireModel(input: TireModelInput): CmsTireModel {
  const { row, tireType } = input;

  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    tireTypeSlug: tireType.slug,
    tireTypeName: tireType.name,
    brand: row.series ?? "",
    treadType: row.tread_type ?? "",
    descriptionShort: row.short_description,
    descriptionLong: lexicalToHtml(row.full_description),
    imageUrl: normalizeImageUrl(input.imageUrl),
    gallery: input.gallery,
    advantages: input.advantages,
    selectionAxles: input.selectionAxles ?? [],
  };
}

export function mapTireVariant(row: TireVariantRow): CmsTireVariant {
  const numericSpecs = {
    rimDiameter: row.rim_diameter,
    loadIndex: row.load_index,
    loadIndexDual: row.load_index_dual,
    speedIndex: row.speed_index,
    plyRating: row.ply_rating,
    overallDiameter: row.overall_diameter,
    sectionWidth: row.section_width,
    treadDepth: row.tread_depth_mm,
    pressureSingleKpa: row.pressure_single_kpa,
    pressureDualKpa: row.pressure_dual_kpa,
    maxLoadSingleKg: row.max_load_single_kg,
    maxLoadDualKg: row.max_load_dual_kg,
    recommendedRim: row.recommended_rim,
  };

  return {
    id: String(row.id),
    size: row.size,
    ...(typeof row.price === "number" ? { price: row.price } : {}),
    priceOnRequest: row.price_on_request,
    available: row.available,
    ...Object.fromEntries(
      Object.entries(numericSpecs).filter(([, value]) => typeof value === "number"),
    ),
  };
}

function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  return imageUrl && !imageUrl.startsWith("data:") ? imageUrl : null;
}
