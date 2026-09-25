import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import { AXLE_OPTIONS } from "@/lib/selection/options";

import styles from "./TireCatalog.module.css";

export function TireModelCard({ model }: { model: TireCatalogModel }) {
  const application = getTireCategoryByValue(model.applicationCategory)?.name;
  const axles = model.selectionAxles
    .map((value) => AXLE_OPTIONS.find((option) => option.value === value)?.label)
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.modelCard} data-tire-model-card>
      <Link className={styles.modelMedia} href={model.href} aria-label={`Открыть модель ${model.name}`}>
        <CatalogImage
          src={model.imageUrl}
          fallbackKey={model.slug}
          alt={`${model.name} — грузовая шина`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
        />
      </Link>
      <div className={styles.modelBody}>
        <div className={styles.modelMeta}>
          <span>{application ?? model.applicationCategory}</span>
          {axles && <span>{axles}</span>}
        </div>
        <div>
          <p className={styles.modelBrand}>{model.brand}</p>
          <h2 className={styles.modelTitle}>
            <Link href={model.href}>{model.name}</Link>
          </h2>
        </div>
        <p className={styles.modelDescription}>{model.descriptionShort}</p>
        <div className={styles.modelFooter}>
          <span>{model.sizes.length ? `${model.sizes.length} типоразмера` : "Размер — по запросу"}</span>
          <Link href={model.href}>Изучить модель <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}
