import {
  buildMainDualPaneMenuSections,
  buildShopDualPaneMenuSections,
} from "./buildDualPaneMenu";
import type { DualPaneMenuData } from "./dualPaneMenuTypes";
import { shopCategoryLabel } from "./shopCategoryPresentation";
import {
  getPublishedTireModels,
  getPublishedWheelModels,
  getShopCategories,
  getTireIQArticles,
} from "./staticCatalog";

export type { DualPaneItem, DualPaneMenuData, DualPaneSection } from "./dualPaneMenuTypes";
export { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "./buildDualPaneMenu";

export async function getMainDualPaneMenu(): Promise<DualPaneMenuData> {
  const [models, articles] = await Promise.all([
    getPublishedTireModels(),
    getTireIQArticles(),
  ]);

  return {
    defaultSectionId: "models",
    sections: buildMainDualPaneMenuSections({ models, articles }),
  };
}

export async function getShopDualPaneMenu(): Promise<DualPaneMenuData> {
  const [wheels, categories] = await Promise.all([
    getPublishedWheelModels(),
    getShopCategories(),
  ]);

  return {
    defaultSectionId: "wheels",
    sections: buildShopDualPaneMenuSections({
      wheels,
      categories: categories.map((category) => ({
        ...category,
        name: shopCategoryLabel(category),
      })),
    }),
  };
}
