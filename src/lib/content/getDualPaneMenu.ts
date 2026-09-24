import {
  buildMainDualPaneMenuSections,
  buildShopDualPaneMenuSections,
} from "./buildDualPaneMenu";
import type { DualPaneMenuData } from "./dualPaneMenuTypes";

export type { DualPaneItem, DualPaneMenuData, DualPaneSection } from "./dualPaneMenuTypes";
export { buildMainDualPaneMenuSections, buildShopDualPaneMenuSections } from "./buildDualPaneMenu";

/** Stage 1: empty catalog — menu shows structure links only. */
export async function getMainDualPaneMenu(): Promise<DualPaneMenuData> {
  return {
    defaultSectionId: "models",
    sections: buildMainDualPaneMenuSections({
      models: [],
      tireTypes: [],
      articles: [],
    }),
  };
}

export async function getShopDualPaneMenu(): Promise<DualPaneMenuData> {
  return {
    defaultSectionId: "wheels",
    sections: buildShopDualPaneMenuSections({
      wheels: [],
      categories: [],
    }),
  };
}
