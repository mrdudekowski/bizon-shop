import type { TireCatalogModel, TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";
import { getModelApplicationValues, getTireCategoryByValue } from "@/lib/catalog/tireCategories";

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
    .flatMap((value) => {
      const option = AXLE_OPTIONS.find((item) => item.value === value);
      return option ? [option.label] : [];
    });
  if (labels.length >= 3) return "Все оси";
  if (labels.length > 0) return labels.join(" / ");
  return model.axlePosition?.trim() || "Уточняется";
}

export function cardSubtitle(model: Pick<TireCatalogModel, "selectionAxles" | "applicationTypes" | "tireTypeName">): string {
  if (model.selectionAxles.length === 1) {
    const axle = AXLE_OPTIONS.find((option) => option.value === model.selectionAxles[0]);
    if (axle) return axle.label;
  }
  const applications = getModelApplicationValues(model)
    .map((value) => APPLICATION_SHORT[value] ?? getTireCategoryByValue(value)?.name ?? value);
  return applications.join(" · ") || (model.selectionAxles.length > 1 ? "Универсальные" : model.tireTypeName);
}
