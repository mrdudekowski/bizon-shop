import { getPageDefaults } from "./pages/defaults";
import type { PageKey } from "./pages/keys";
import type { PageContentByKey } from "./pages/types";

/** Stage 1: static page defaults only (backend-app will merge published content later). */
export async function getPageContent<K extends PageKey>(
  key: K,
): Promise<PageContentByKey[K]> {
  return getPageDefaults(key);
}
