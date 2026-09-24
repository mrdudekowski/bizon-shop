import type { PageShell } from "@/lib/content/pages/types";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";

import { HomeSelectionPanel } from "./HomeSelectionPanel";

export function TireSelectionEntry({
  content,
  catalog,
}: {
  content: PageShell;
  catalog: TireCatalogReadModel;
}) {
  return <HomeSelectionPanel content={content} catalog={catalog} />;
}
