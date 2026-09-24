import type {
  CmsArticle,
  CmsProduct,
  CmsShopCategory,
  CmsStory,
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

const emptySlugs: string[] = [];

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
  return [];
}

export async function getTireIQArticleBySlug(_slug: string): Promise<CmsArticle | null> {
  return null;
}

export async function getAllTireIQSlugs(): Promise<string[]> {
  return emptySlugs;
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
  return [];
}

export async function getTireTypeBySlug(_slug: string): Promise<CmsTireType | null> {
  return null;
}

export async function getAllTireTypeSlugs(): Promise<string[]> {
  return emptySlugs;
}

export async function getTireModelsByTypeSlug(_slug: string): Promise<CmsTireModel[]> {
  return [];
}

export async function getTireModelByTypeAndSlug(
  _typeSlug: string,
  _modelSlug: string,
): Promise<CmsTireModel | null> {
  return null;
}

export async function getAllTireModelRouteParams(): Promise<TireModelRouteParam[]> {
  return [];
}

export async function getPublishedTireModels(): Promise<CmsTireModel[]> {
  return [];
}

export async function getTireVariantsByModelId(_modelId: string): Promise<CmsTireVariant[]> {
  return [];
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
