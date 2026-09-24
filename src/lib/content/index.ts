export { getPageContent } from "./getPageContent";
export { getMainDualPaneMenu, getShopDualPaneMenu } from "./getDualPaneMenu";
export {
  getShopProducts,
  getShopProductsByCategorySlug,
  getShopProductBySlug,
  getAllShopProductSlugs,
  getShopCategories,
  getShopCategoryBySlug,
  getAllShopCategorySlugs,
  getTireIQArticles,
  getTireIQArticleBySlug,
  getAllTireIQSlugs,
  getPeopleStories,
  getPeopleStoryBySlug,
  getAllPeopleStorySlugs,
  getTireTypes,
  getTireTypeBySlug,
  getAllTireTypeSlugs,
  getTireModelsByTypeSlug,
  getTireModelByTypeAndSlug,
  getAllTireModelRouteParams,
  getPublishedTireModels,
  getTireVariantsByModelId,
  getWheelTypes,
  getWheelTypeBySlug,
  getAllWheelTypeSlugs,
  getWheelModelsByTypeSlug,
  getWheelModelByTypeAndSlug,
  getAllWheelModelRouteParams,
  getPublishedWheelModels,
  getWheelVariantsByModelId,
  getWheelVariantsByTypeSlug,
} from "./staticCatalog";

export { getPublishedTireCatalog } from "@/lib/catalog/getPublishedTireCatalog";
export { resolveMedia, resolveMediaUrl, type ResolvedMedia } from "./media";

export type {
  CmsProduct,
  CmsShopCategory,
  CmsTireType,
  CmsTireModel,
  CmsTireVariant,
  CmsWheelType,
  CmsWheelModel,
  CmsWheelVariant,
  TireModelRouteParam,
  WheelModelRouteParam,
  CmsArticle,
  CmsStory,
} from "./types";
