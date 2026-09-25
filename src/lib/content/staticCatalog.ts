import type {
  CmsArticle,
  CmsProduct,
  CmsShopCategory,
  CmsStory,
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
import { fetchPublishedJson, publishedApiEnabled } from "./publishedClient";
import type {
  CatalogAxle,
  OperatingCondition,
  VehicleType,
} from "@/lib/selection/options";

const emptySlugs: string[] = [];

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
  applicationCategory?: string;
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
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    tireTypeSlug: raw.tireTypeSlug,
    tireTypeName: raw.tireTypeName,
    applicationCategory: raw.applicationCategory ?? "",
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

export async function getShopProducts(_options?: GetShopProductsOptions): Promise<CmsProduct[]> {
  return [];
}

export async function getShopProductsByCategorySlug(_slug: string): Promise<CmsProduct[]> {
  return [];
}

export async function getShopProductBySlug(_slug: string): Promise<CmsProduct | null> {
  return null;
}

export async function getAllShopProductSlugs(): Promise<string[]> {
  return emptySlugs;
}

export async function getShopCategories(): Promise<CmsShopCategory[]> {
  return [];
}

export async function getShopCategoryBySlug(_slug: string): Promise<CmsShopCategory | null> {
  return null;
}

export async function getAllShopCategorySlugs(): Promise<string[]> {
  return emptySlugs;
}

export async function getTireIQArticles(_topic?: string): Promise<CmsArticle[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const articles = await fetchPublishedJson<CmsArticle[]>("/v1/articles");
  return articles ?? [];
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

export async function getPeopleStories(): Promise<CmsStory[]> {
  return [];
}

export async function getPeopleStoryBySlug(_slug: string): Promise<CmsStory | null> {
  return null;
}

export async function getAllPeopleStorySlugs(): Promise<string[]> {
  return emptySlugs;
}

export async function getTireTypes(): Promise<CmsTireType[]> {
  if (!publishedApiEnabled()) {
    return [];
  }
  const types = await fetchPublishedJson<BackendTireType[]>("/v1/tires/types");
  return (types ?? []).map(normalizeTireType);
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
  const models = await fetchPublishedJson<BackendTireModel[]>(
    `/v1/tires/types/${encodeURIComponent(slug)}/models`,
  );
  return (models ?? []).map(normalizeTireModel);
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
  const variants = await fetchPublishedJson<BackendTireVariant[]>(
    `/v1/tires/models/${encodeURIComponent(modelId)}/variants`,
  );
  return (variants ?? []).map(normalizeTireVariant);
}

export async function getWheelTypes(): Promise<CmsWheelType[]> {
  return [];
}

export async function getWheelTypeBySlug(_slug: string): Promise<CmsWheelType | null> {
  return null;
}

export async function getAllWheelTypeSlugs(): Promise<string[]> {
  return emptySlugs;
}

export async function getWheelModelsByTypeSlug(_slug: string): Promise<CmsWheelModel[]> {
  return [];
}

export async function getWheelModelByTypeAndSlug(
  _typeSlug: string,
  _modelSlug: string,
): Promise<CmsWheelModel | null> {
  return null;
}

export async function getAllWheelModelRouteParams(): Promise<WheelModelRouteParam[]> {
  return [];
}

export async function getPublishedWheelModels(): Promise<CmsWheelModel[]> {
  return [];
}

export async function getWheelVariantsByModelId(_modelId: string): Promise<CmsWheelVariant[]> {
  return [];
}

export async function getWheelVariantsByTypeSlug(_slug: string): Promise<CmsWheelVariant[]> {
  return [];
}
