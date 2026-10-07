import type {
  CmsArticle,
  CmsProduct,
  CmsShopCategory,
  CmsTireAdvantage,
  CmsTireDocument,
  CmsTireModel,
  CmsTireType,
  CmsWheelModel,
  CmsWheelType,
  CmsWheelVariant,
  CmsTireVariant,
  GetShopProductsOptions,
  TireModelRouteParam,
  WheelModelRouteParam,
} from "./types";
import { fetchPublishedJson, fetchPublishedList, publishedApiEnabled } from "./publishedClient";
import type {
  CatalogAxle,
  OperatingCondition,
  VehicleType,
} from "@/lib/selection/options";

type PayloadRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PayloadRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: unknown, ...keys: string[]): value is PayloadRecord {
  return isRecord(value) && keys.every((key) => typeof value[key] === "string");
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isShopVariant(value: unknown): boolean {
  return hasStrings(value, "id")
    && typeof value.priceOnRequest === "boolean"
    && typeof value.available === "boolean"
    && isStringArray(value.images);
}

function isShopProduct(value: unknown): boolean {
  return hasStrings(value, "slug", "name", "categorySlug", "type", "brand", "descriptionShort", "descriptionLong")
    && isStringArray(value.gallery)
    && Array.isArray(value.variants)
    && value.variants.every(isShopVariant)
    && typeof value.priceOnRequest === "boolean"
    && typeof value.available === "boolean";
}

function isShopCategory(value: unknown): boolean {
  return hasStrings(value, "slug", "name", "description")
    && typeof value.showInMenu === "boolean"
    && typeof value.sortOrder === "number"
    && (value.carousel === undefined || Array.isArray(value.carousel));
}

function isArticle(value: unknown): boolean {
  return hasStrings(value, "slug", "title", "excerpt", "publishedAt")
    && typeof value.showInMenu === "boolean"
    && typeof value.menuOrder === "number"
    && isRecord(value)
    && Object.prototype.hasOwnProperty.call(value, "content");
}

function isTireType(value: unknown): boolean {
  return hasStrings(value, "slug", "name")
    && (value.description === undefined || typeof value.description === "string" || value.description === null)
    && (value.descriptionShort === undefined || typeof value.descriptionShort === "string" || value.descriptionShort === null)
    && (value.sortOrder === undefined || typeof value.sortOrder === "number")
    && (value.showInMenu === undefined || typeof value.showInMenu === "boolean");
}

function isTireModel(value: unknown): boolean {
  return hasStrings(value, "id", "slug", "name", "tireTypeSlug", "tireTypeName");
}

function isTireVariant(value: unknown): boolean {
  return hasStrings(value, "id", "size")
    && typeof value.available === "boolean"
    && typeof value.priceOnRequest === "boolean";
}

function isWheelType(value: unknown): boolean {
  return hasStrings(value, "slug", "name", "description", "shortDescription")
    && typeof value.sortOrder === "number";
}

function isWheelModel(value: unknown): boolean {
  return hasStrings(value, "id", "slug", "name", "wheelTypeSlug", "wheelTypeName", "descriptionShort", "descriptionLong")
    && typeof value.showInMenu === "boolean"
    && typeof value.menuOrder === "number"
    && Array.isArray(value.gallery)
    && value.gallery.every((image) => hasStrings(image, "url", "alt", "label"));
}

function isWheelVariant(value: unknown): boolean {
  return hasStrings(value, "id", "modelId", "sizeLabel")
    && typeof value.available === "boolean"
    && typeof value.priceOnRequest === "boolean";
}


type BackendTireType = {
  slug: string;
  name: string;
  description?: string | null;
  descriptionShort?: string | null;
  sortOrder?: number;
  showInMenu?: boolean;
  imageUrl?: string | null;
  vehicleTypes?: string[];
  conditions?: string[];
};

type BackendTireModel = {
  id: string;
  slug: string;
  name: string;
  tireTypeSlug: string;
  tireTypeName: string;
  applicationTypes?: string[];
  brand?: string;
  descriptionShort?: string;
  descriptionLong?: string;
  imageUrl?: string | null;
  application?: string;
  axlePosition?: string;
  treadType?: string;
  gallery?: unknown[];
  advantages?: unknown[];
  documents?: unknown[];
  selectionVehicleTypes?: string[];
  selectionConditions?: string[];
  selectionAxles?: string[];
  showInMenu?: boolean;
  menuOrder?: number;
};

type BackendTireVariant = {
  id: string;
  size: string;
  rimDiameter?: number;
  loadIndex?: number | string;
  loadIndexDual?: number | string;
  speedIndex?: number | string;
  plyRating?: number | string;
  overallDiameter?: number;
  sectionWidth?: number;
  treadDepth?: number;
  pressureSingleKpa?: number;
  pressureDualKpa?: number;
  maxLoadSingleKg?: number;
  maxLoadDualKg?: number;
  recommendedRim?: number | string;
  available: boolean;
  price?: number;
  priceOnRequest: boolean;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeAdvantages(value: unknown): CmsTireAdvantage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const entry = item as { key?: unknown; title?: unknown; description?: unknown };
    if (typeof entry.key !== "string" || typeof entry.title !== "string") {
      return [];
    }
    return [
      {
        key: entry.key,
        title: entry.title,
        ...(typeof entry.description === "string"
          ? { description: entry.description }
          : {}),
      },
    ];
  });
}

function normalizeDocuments(value: unknown): CmsTireDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const entry = item as { url?: unknown; title?: unknown };
    if (typeof entry.url !== "string" || typeof entry.title !== "string") {
      return [];
    }
    return [{ url: entry.url, title: entry.title }];
  });
}

function optionalString(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function normalizeTireType(raw: BackendTireType): CmsTireType {
  return {
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? "",
    shortDescription: raw.descriptionShort ?? "",
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : Number(raw.sortOrder) || 0,
    showInMenu: raw.showInMenu ?? true,
    imageUrl: raw.imageUrl,
    selectionVehicleTypes: (raw.vehicleTypes ?? []) as VehicleType[],
    selectionConditions: (raw.conditions ?? []) as OperatingCondition[],
  };
}

function normalizeTireModel(raw: BackendTireModel): CmsTireModel {
  const applicationTypes = asStringArray(raw.applicationTypes);
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    tireTypeSlug: raw.tireTypeSlug,
    tireTypeName: raw.tireTypeName,
    applicationTypes,
    brand: raw.brand ?? "",
    descriptionShort: raw.descriptionShort ?? "",
    descriptionLong: raw.descriptionLong ?? "",
    imageUrl: raw.imageUrl,
    application: raw.application,
    axlePosition: raw.axlePosition,
    treadType: raw.treadType,
    gallery: asStringArray(raw.gallery),
    advantages: normalizeAdvantages(raw.advantages),
    documents: normalizeDocuments(raw.documents),
    selectionVehicleTypes: (raw.selectionVehicleTypes ?? []) as VehicleType[],
    selectionConditions: (raw.selectionConditions ?? []) as OperatingCondition[],
    selectionAxles: (raw.selectionAxles ?? []) as CatalogAxle[],
    showInMenu: raw.showInMenu ?? true,
    menuOrder: typeof raw.menuOrder === "number" ? raw.menuOrder : 0,
  };
}

function normalizeTireVariant(raw: BackendTireVariant): CmsTireVariant {
  return {
    id: String(raw.id),
    size: raw.size,
    rimDiameter: raw.rimDiameter,
    loadIndex: optionalString(raw.loadIndex),
    loadIndexDual: optionalString(raw.loadIndexDual),
    speedIndex: optionalString(raw.speedIndex),
    plyRating: optionalString(raw.plyRating),
    overallDiameter: raw.overallDiameter,
    sectionWidth: raw.sectionWidth,
    treadDepth: raw.treadDepth,
    pressureSingleKpa: raw.pressureSingleKpa,
    pressureDualKpa: raw.pressureDualKpa,
    maxLoadSingleKg: raw.maxLoadSingleKg,
    maxLoadDualKg: raw.maxLoadDualKg,
    recommendedRim: optionalString(raw.recommendedRim),
    available: raw.available,
    price: raw.price,
    priceOnRequest: raw.priceOnRequest,
  };
}

export async function getShopProducts(options?: GetShopProductsOptions): Promise<CmsProduct[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const category = options?.categorySlug?.trim();
  const path = category
    ? `/v1/shop/products?category=${encodeURIComponent(category)}`
    : "/v1/shop/products";
  return fetchPublishedList<CmsProduct>(path, isShopProduct);
}

export async function getShopProductsByCategorySlug(slug: string): Promise<CmsProduct[]> {
  return getShopProducts({ categorySlug: slug });
}

export async function getShopProductBySlug(slug: string): Promise<CmsProduct | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  return fetchPublishedJson<CmsProduct>(`/v1/shop/products/${encodeURIComponent(slug)}`);
}

export async function getAllShopProductSlugs(): Promise<string[]> {
  const products = await getShopProducts();
  return products.map((product) => product.slug);
}

export async function getShopCategories(): Promise<CmsShopCategory[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  return fetchPublishedList<CmsShopCategory>("/v1/shop/categories", isShopCategory);
}

export async function getShopCategoryBySlug(slug: string): Promise<CmsShopCategory | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  return fetchPublishedJson<CmsShopCategory>(`/v1/shop/categories/${encodeURIComponent(slug)}`);
}

export async function getAllShopCategorySlugs(): Promise<string[]> {
  const categories = await getShopCategories();
  return categories.map((category) => category.slug);
}

export async function getTireIQArticles(_topic?: string): Promise<CmsArticle[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  return fetchPublishedList<CmsArticle>("/v1/articles", isArticle);
}

export async function getTireIQArticleBySlug(slug: string): Promise<CmsArticle | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  return fetchPublishedJson<CmsArticle>(`/v1/articles/${encodeURIComponent(slug)}`);
}

export async function getAllTireIQSlugs(): Promise<string[]> {
  const articles = await getTireIQArticles();
  return articles.map((article) => article.slug);
}

export async function getTireTypes(): Promise<CmsTireType[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await fetchPublishedList<BackendTireType>("/v1/tires/types", isTireType);
  return types.map(normalizeTireType);
}

export async function getTireTypeBySlug(slug: string): Promise<CmsTireType | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  const type = await fetchPublishedJson<BackendTireType>(
    `/v1/tires/types/${encodeURIComponent(slug)}`,
  );
  return type ? normalizeTireType(type) : null;
}

export async function getAllTireTypeSlugs(): Promise<string[]> {
  const types = await getTireTypes();
  return types.map((type) => type.slug);
}

export async function getTireModelsByTypeSlug(slug: string): Promise<CmsTireModel[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const models = await fetchPublishedList<BackendTireModel>(
    `/v1/tires/types/${encodeURIComponent(slug)}/models`,
    isTireModel,
  );
  return models.map(normalizeTireModel);
}

export async function getTireModelByTypeAndSlug(
  typeSlug: string,
  modelSlug: string,
): Promise<CmsTireModel | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  const model = await fetchPublishedJson<BackendTireModel>(
    `/v1/tires/models/${encodeURIComponent(typeSlug)}/${encodeURIComponent(modelSlug)}`,
  );
  return model ? normalizeTireModel(model) : null;
}

export async function getAllTireModelRouteParams(): Promise<TireModelRouteParam[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await getTireTypes();
  const nested = await Promise.all(
    types.map(async (type) => {
      const models = await getTireModelsByTypeSlug(type.slug);
      return models.map((model) => ({
        tireTypeSlug: type.slug,
        modelSlug: model.slug,
      }));
    }),
  );
  return nested.flat();
}

export async function getPublishedTireModels(): Promise<CmsTireModel[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await getTireTypes();
  const nested = await Promise.all(
    types.map((type) => getTireModelsByTypeSlug(type.slug)),
  );
  return nested.flat();
}

export async function getTireVariantsByModelId(modelId: string): Promise<CmsTireVariant[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const variants = await fetchPublishedList<BackendTireVariant>(
    `/v1/tires/models/${encodeURIComponent(modelId)}/variants`,
    isTireVariant,
  );
  return variants.map(normalizeTireVariant);
}

export async function getWheelTypes(): Promise<CmsWheelType[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  return fetchPublishedList<CmsWheelType>("/v1/wheels/types", isWheelType);
}

export async function getWheelTypeBySlug(slug: string): Promise<CmsWheelType | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  return fetchPublishedJson<CmsWheelType>(`/v1/wheels/types/${encodeURIComponent(slug)}`);
}

export async function getAllWheelTypeSlugs(): Promise<string[]> {
  const types = await getWheelTypes();
  return types.map((type) => type.slug);
}

export async function getWheelModelsByTypeSlug(slug: string): Promise<CmsWheelModel[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const models = await fetchPublishedList<CmsWheelModel>(
    `/v1/wheels/types/${encodeURIComponent(slug)}/models`,
    isWheelModel,
  );
  return models;
}

export async function getWheelModelByTypeAndSlug(
  typeSlug: string,
  modelSlug: string,
): Promise<CmsWheelModel | null> {
  if (!publishedApiEnabled()) {
    return null;
  }
  return fetchPublishedJson<CmsWheelModel>(
    `/v1/wheels/models/${encodeURIComponent(typeSlug)}/${encodeURIComponent(modelSlug)}`,
  );
}

export async function getAllWheelModelRouteParams(): Promise<WheelModelRouteParam[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await getWheelTypes();
  const nested = await Promise.all(
    types.map(async (type) => {
      const models = await getWheelModelsByTypeSlug(type.slug);
      return models.map((model) => ({
        wheelTypeSlug: type.slug,
        modelSlug: model.slug,
      }));
    }),
  );
  return nested.flat();
}

export async function getPublishedWheelModels(): Promise<CmsWheelModel[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await getWheelTypes();
  const nested = await Promise.all(types.map((type) => getWheelModelsByTypeSlug(type.slug)));
  return nested.flat();
}

export async function getWheelVariantsByModelId(modelId: string): Promise<CmsWheelVariant[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const variants = await fetchPublishedList<CmsWheelVariant>(
    `/v1/wheels/models/${encodeURIComponent(modelId)}/variants`,
    isWheelVariant,
  );
  return variants;
}

export async function getWheelVariantsByTypeSlug(slug: string): Promise<CmsWheelVariant[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const variants = await fetchPublishedList<CmsWheelVariant>(
    `/v1/wheels/types/${encodeURIComponent(slug)}/variants`,
    isWheelVariant,
  );
  return variants;
}
