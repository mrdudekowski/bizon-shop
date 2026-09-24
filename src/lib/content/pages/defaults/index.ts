import type { PageKey } from "../keys";
import type { AnyPageContent, PageContentByKey } from "../types";
import { HOME_PAGE_DEFAULTS } from "./home";
import { SHOP_HOME_PAGE_DEFAULTS } from "./shopHome";
import { stubPageDefaults } from "./stub";

export function getPageDefaults<K extends PageKey>(key: K): PageContentByKey[K] {
  if (key === "home") return HOME_PAGE_DEFAULTS as PageContentByKey[K];
  if (key === "shop-home") return SHOP_HOME_PAGE_DEFAULTS as PageContentByKey[K];
  return stubPageDefaults(key) as PageContentByKey[K];
}

export function getAnyPageDefaults(key: PageKey): AnyPageContent {
  return getPageDefaults(key);
}

export { HOME_PAGE_DEFAULTS, SHOP_HOME_PAGE_DEFAULTS, stubPageDefaults };
