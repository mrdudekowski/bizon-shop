import {
  getShopProducts,
  getAllShopProductSlugs,
  getShopProductsByCategorySlug,
} from "./getProducts";
import { getShopProductBySlug } from "./getProductBySlug";
import { getShopCategories, getShopCategoryBySlug, getAllShopCategorySlugs } from "./getShopCategories";
import {
  getTireIQArticles,
  getTireIQArticleBySlug,
  getAllTireIQSlugs,
} from "./getTireIQArticles";
import {
  getPeopleStories,
  getPeopleStoryBySlug,
  getAllPeopleStorySlugs,
} from "./getPeopleStories";
import {
  getTireModelsByTypeSlug,
  getTireModelByTypeAndSlug,
  getAllTireModelRouteParams,
} from "./getTireModels";
import { getTireTypes, getTireTypeBySlug, getAllTireTypeSlugs } from "./getTireTypes";
import { getTireVariantsByModelId } from "./getTireVariants";
import {
  getWheelModelsByTypeSlug,
  getWheelModelByTypeAndSlug,
  getAllWheelModelRouteParams,
} from "./getWheelModels";
import {
  getWheelTypes,
  getWheelTypeBySlug,
  getAllWheelTypeSlugs,
} from "./getWheelTypes";
import { getWheelVariantsByModelId, getWheelVariantsByTypeSlug } from "./getWheelVariants";
import { getMenuItems } from "./getMenuItems";

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
  getTireVariantsByModelId,
  getWheelTypes,
  getWheelTypeBySlug,
  getAllWheelTypeSlugs,
  getWheelModelsByTypeSlug,
  getWheelModelByTypeAndSlug,
  getAllWheelModelRouteParams,
  getWheelVariantsByModelId,
  getWheelVariantsByTypeSlug,
  getMenuItems,
};

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
