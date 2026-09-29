import {
  buildMainDualPaneMenuSections,
  buildShopDualPaneMenuSections,
} from "./buildDualPaneMenu";
import type { DualPaneMenuData } from "./dualPaneMenuTypes";
import {
  getPublishedTireModels,
  getPublishedWheelModels,
  getShopCategories,
  getTireIQArticles,
} from "./staticCatalog";

export type { DualPaneItem, DualPaneMenuData, DualPaneSection } from "./dualPaneMenuTypes";
export { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "./buildDualPaneMenu";

export async function getMainDualPaneMenu(): Promise<DualPaneMenuData> {
  const [models, articles, categories] = await Promise.all([
    getPublishedTireModels(),
    getTireIQArticles(),
    getShopCategories(),
  ]);

  return {
    defaultSectionId: "models",
    sections: buildMainDualPaneMenuSections({ models, articles, categories }),
  };
}

export async function getShopDualPaneMenu(): Promise<DualPaneMenuData> {
  const [wheels, categories] = await Promise.all([
    getPublishedWheelModels(),
    getShopCategories(),
  ]);

  return {
    defaultSectionId: "wheels",
    sections: buildShopDualPaneMenuSections({ wheels, categories }),
  };
}
