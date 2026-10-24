"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelTypeCover } from "@/components/catalog/WheelTypeCover";
import { WheelModelGrid } from "@/components/catalog/WheelModelGrid";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";
import type { CmsWheelModel, CmsWheelType, CmsWheelVariant } from "@/lib/content/types";

export function WheelTypeRuntime({ type: initialType, models: initialModels, variants: initialVariants }: {
  type: CmsWheelType;
  models: CmsWheelModel[];
  variants: CmsWheelVariant[];
}) {
  const [type, setType] = useState(initialType);
  const [models, setModels] = useState(initialModels);
  const [variants, setVariants] = useState(initialVariants);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      fetchBrowserPublishedJson<CmsWheelType>(`/v1/wheels/types/${encodeURIComponent(initialType.slug)}`, controller.signal),
      fetchBrowserPublishedList<CmsWheelModel>(`/v1/wheels/types/${encodeURIComponent(initialType.slug)}/models`, controller.signal),
      fetchBrowserPublishedList<CmsWheelVariant>(`/v1/wheels/types/${encodeURIComponent(initialType.slug)}/variants`, controller.signal),
    ]).then(([publishedType, publishedModels, publishedVariants]) => {
      if (controller.signal.aborted) return;
      setType(publishedType);
      setModels(publishedModels);
      setVariants(publishedVariants);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) console.warn("Could not refresh published wheel type; showing generated content.", error);
    });
    return () => controller.abort();
  }, [initialType.slug]);

  const typeBasePath = `/shop/wheels/${type.slug}`;
  return <div className="section-inner">
    <PageHeader title={type.name} description={type.shortDescription || type.description} breadcrumbs={[
      { href: "/", label: "Главная" }, { href: "/shop", label: "Магазин" }, { href: typeBasePath, label: type.name },
    ]} />
    <WheelTypeCover imageUrl={type.imageUrl} name={type.name} />
    {type.shortDescription && type.description ? <p className="section-description">{type.description}</p> : null}
    {models.length ? <WheelModelGrid models={models} variants={variants} typeBasePath={typeBasePath} /> : <p className="section-description">Модели этого типа скоро появятся.</p>}
    <p className="mt-8"><Link href="/shop" className="btn-glass inline-flex"><SiteArrow direction="left" /> Магазин</Link></p>
  </div>;
}
