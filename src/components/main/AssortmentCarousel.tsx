"use client";

import { TireModelCard } from "@/components/catalog/TireModelCard";
import { LoopedStrip } from "@/components/catalog/LoopedStrip";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";

export function AssortmentCarousel({ models }: { models: TireCatalogModel[] }) {
  if (models.length === 0) return null;

  return (
    <LoopedStrip count={models.length} label="Ключевые модели шин" tone="light">
      {(index) => {
        const model = models[index];
        const cardModel = model.imageUrl || !model.gallery[0]
          ? model
          : { ...model, imageUrl: model.gallery[0] };
        return <TireModelCard key={model.id} model={cardModel} linkWholeCard />;
      }}
    </LoopedStrip>
  );
}
