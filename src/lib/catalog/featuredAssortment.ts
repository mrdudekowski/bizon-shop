import type { TireCatalogModel, TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";

export const ASSORTMENT_PREVIEW_COUNT = 3;

const APPLICATION_SHORT: Record<string, string> = {
  long_haul: "Магистральные",
  regional: "Региональные",
  off_road: "Сложные покрытия",
  construction: "Строительство",
  urban: "Городские",
};

export function pickAssortmentModels(catalog: TireCatalogReadModel): TireCatalogModel[] {
  const models = catalog.directions.flatMap((direction) => direction.models);
  const withImage = models.filter((model) => model.imageUrl || model.gallery[0]);
  return (withImage.length > 0 ? withImage : models).slice(0, ASSORTMENT_PREVIEW_COUNT);
}

export function formatAxleLabels(model: Pick<TireCatalogModel, "selectionAxles" | "axlePosition">): string {
  const labels = model.selectionAxles
    .map((value) => AXLE_OPTIONS.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));
  if (labels.length >= 3) return "Все оси";
  if (labels.length > 0) return labels.join(" / ");
  return model.axlePosition?.trim() || "Уточняется";
}

export function cardSubtitle(model: Pick<TireCatalogModel, "selectionAxles" | "applicationCategory" | "tireTypeName">): string {
  if (model.selectionAxles.length === 1) {
    const axle = AXLE_OPTIONS.find((option) => option.value === model.selectionAxles[0]);
    if (axle) return axle.label;
  }
  return APPLICATION_SHORT[model.applicationCategory] || (model.selectionAxles.length > 1 ? "Универсальные" : model.tireTypeName);
}
