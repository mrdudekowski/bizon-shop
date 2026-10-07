import {
  buildMainDualPaneMenuSections,
  buildShopDualPaneMenuSections,
} from "./buildDualPaneMenu";
import type { DualPaneMenuData } from "./dualPaneMenuTypes";
import { loadPublished } from "./loadPublished";
import {
  getPublishedTireModels,
  getPublishedWheelModels,
  getShopCategories,
  getTireIQArticles,
} from "./staticCatalog";

export type { DualPaneItem, DualPaneMenuData, DualPaneSection } from "./dualPaneMenuTypes";
export { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "./buildDualPaneMenu";

export async function getMainDualPaneMenu(): Promise<DualPaneMenuData> {
  const loaded = await loadPublished(() => Promise.all([
    getPublishedTireModels(),
    getTireIQArticles(),
    getShopCategories(),
  ]));
  const [models, articles, categories] = loaded.kind === "ok" ? loaded.value : [[], [], []];

  return {
    defaultSectionId: "models",
    sections: buildMainDualPaneMenuSections({ models, articles, categories }),
  };
}

export async function getShopDualPaneMenu(): Promise<DualPaneMenuData> {
  const loaded = await loadPublished(() => Promise.all([
    getPublishedWheelModels(),
    getShopCategories(),
  ]));
  const [wheels, categories] = loaded.kind === "ok" ? loaded.value : [[], []];

  return {
    defaultSectionId: "wheels",
    sections: buildShopDualPaneMenuSections({ wheels, categories }),
  };
}
