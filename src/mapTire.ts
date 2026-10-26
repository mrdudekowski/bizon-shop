type TireModelRow = {
  id: string | number;
  name: string;
  slug: string;
  short_description: string;
  full_description: unknown;
  series: string | null;
  tread_type: string | null;
  show_in_menu?: boolean | null;
  menu_order?: number | string | null;
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
  applicationTypes?: string[];
  documents?: { url: string; title: string }[];
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

type TireVariantRow = {
  id: string | number;
  size: string | null;
  size_normalized?: string | null;
  price: unknown;
  price_on_request: boolean | null;
  available: boolean | null;
  rim_diameter?: unknown;
  rim_diameter_in?: unknown;
  load_index?: unknown;
  load_index_single?: unknown;
  load_index_dual?: unknown;
  speed_index?: unknown;
  speed_symbol?: unknown;
  ply_rating?: unknown;
  ply_rating_pr?: unknown;
  overall_diameter?: unknown;
  overall_diameter_mm?: unknown;
  section_width?: unknown;
  section_width_mm?: unknown;
  tread_depth_mm?: unknown;
  pressure_single_kpa?: unknown;
  pressure_dual_kpa?: unknown;
  max_load_single_kg?: unknown;
  max_load_dual_kg?: unknown;
  recommended_rim?: unknown;
  standard_rim_in?: unknown;
};

export type CmsTireType = {
  name: string;
  slug: string;
  description: string | null;
  descriptionShort: string | null;
  sortOrder: number;
  showInMenu: boolean;
  imageUrl: string | null;
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
  applicationTypes: string[];
  documents: { url: string; title: string }[];
  showInMenu: boolean;
  menuOrder: number;
};

export type CmsTireVariant = {
  id: string;
  size: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
  rimDiameter?: number;
  loadIndex?: string;
  loadIndexDual?: string;
  speedIndex?: string;
  plyRating?: string;
  overallDiameter?: number;
  sectionWidth?: number;
  treadDepth?: number;
  pressureSingleKpa?: number;
  pressureDualKpa?: number;
  maxLoadSingleKg?: number;
  maxLoadDualKg?: number;
  recommendedRim?: string;
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

export function mapTireType(row: TireTypeRow): CmsTireType {
  return {
    name: row.name,
    slug: row.slug,
    description: row.description,
    descriptionShort: row.short_description,
    sortOrder: toFiniteNumber(row.sort_order) ?? 0,
    showInMenu: row.show_in_menu,
    imageUrl: normalizeImageUrl(row.image_url),
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
    applicationTypes: input.applicationTypes ?? [],
    documents: input.documents ?? [],
    showInMenu: row.show_in_menu === true,
    menuOrder: toFiniteNumber(row.menu_order) ?? 0,
  };
}

export function mapTireVariant(row: TireVariantRow): CmsTireVariant {
  const price = toFiniteNumber(row.price);
  const numericSpecs = {
    rimDiameter: toFiniteNumber(row.rim_diameter) ?? toFiniteNumber(row.rim_diameter_in),
    overallDiameter: toFiniteNumber(row.overall_diameter) ?? toFiniteNumber(row.overall_diameter_mm),
    sectionWidth: toFiniteNumber(row.section_width) ?? toFiniteNumber(row.section_width_mm),
    treadDepth: toFiniteNumber(row.tread_depth_mm),
    pressureSingleKpa: toFiniteNumber(row.pressure_single_kpa),
    pressureDualKpa: toFiniteNumber(row.pressure_dual_kpa),
    maxLoadSingleKg: toFiniteNumber(row.max_load_single_kg),
    maxLoadDualKg: toFiniteNumber(row.max_load_dual_kg),
  };
  const textSpecs = {
    loadIndex: toTextSpecification(row.load_index) ?? toTextSpecification(row.load_index_single),
    loadIndexDual: toTextSpecification(row.load_index_dual),
    speedIndex: toTextSpecification(row.speed_index) ?? toTextSpecification(row.speed_symbol),
    plyRating: toTextSpecification(row.ply_rating) ?? toTextSpecification(row.ply_rating_pr),
    recommendedRim: toTextSpecification(row.recommended_rim) ?? toTextSpecification(row.standard_rim_in),
  };

  return {
    id: String(row.id),
    size:
      [row.size, row.size_normalized].find(
        (value): value is string => typeof value === "string" && value.trim() !== "",
      ) ?? "",
    ...(price !== undefined ? { price } : {}),
    priceOnRequest: price === undefined || row.price_on_request === true,
    available: row.available !== false,
    ...Object.fromEntries(
      [...Object.entries(numericSpecs), ...Object.entries(textSpecs)].filter(
        ([, value]) => value !== undefined,
      ),
    ),
  };
}

export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function toTextSpecification(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() ? value : undefined;
  }

  return typeof value === "number" && Number.isFinite(value) ? String(value) : undefined;
}

export function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.startsWith("data:")) return null;
  const payloadFile = imageUrl.match(/^\/api\/media\/file\/([^/?#]+)$/);
  if (payloadFile) return `/media/${decodeURIComponent(payloadFile[1])}`;
  return imageUrl;
}
