import type { HomePageContent } from "@/lib/content/pages/types";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";

import { HomeSelectionPanel } from "./HomeSelectionPanel";

export function TireSelectionEntry({
  content,
  catalog,
}: {
  content: HomePageContent["selectionEntry"];
  catalog: TireCatalogReadModel;
}) {
  return <HomeSelectionPanel content={content} catalog={catalog} />;
}
