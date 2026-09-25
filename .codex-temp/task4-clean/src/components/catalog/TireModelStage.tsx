import Link from "next/link";

import { CatalogBuyPanel } from "@/components/catalog/CatalogBuyPanel";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { ModelAdvantagesCarousel } from "@/components/catalog/ModelAdvantagesCarousel";
import { PageHeader } from "@/components/catalog/PageHeader";
import { TireVariantsTable } from "@/components/catalog/TireVariantsTable";
import { getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireVariant } from "@/lib/cms/types";
import { AXLE_OPTIONS } from "@/lib/selection/options";

import styles from "./TireCatalog.module.css";

type Breadcrumb = { href: string; label: string };

type TireModelStageProps = {
  model: TireCatalogModel;
  variants: CmsTireVariant[];
  modelPath: string;
  breadcrumbs: Breadcrumb[];
};

export function TireModelStage({
  model,
  variants,
  modelPath,
  breadcrumbs,
}: TireModelStageProps) {
  const application = getTireCategoryByValue(model.applicationCategory)?.name;
  const axleLabels = model.selectionAxles
    .map((value) => AXLE_OPTIONS.find((option) => option.value === value)?.label)
    .filter(Boolean);
  const contactHref = `/contact?model=${encodeURIComponent(model.slug)}&type=${encodeURIComponent(model.tireTypeSlug)}`;
  const gallery = [model.imageUrl, ...model.gallery].filter(
    (url, index, values): url is string => Boolean(url) && values.indexOf(url) === index,
  );

  return (
    <main className={styles.modelPage} data-main-chrome-tone="light">
      <div className={styles.pageInner}>
        <PageHeader
          title={model.name}
          description={model.descriptionShort}
          breadcrumbs={breadcrumbs}
        />

        <section className={styles.productStage} aria-labelledby="product-stage-title">
          <div className={styles.productMedia}>
            <CatalogImage
              src={gallery[0]}
              fallbackKey={model.slug}
              alt={`${model.name} — грузовая шина`}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 58vw"
            />
            <span className={styles.mediaIndex}>
              01 / {String(Math.max(gallery.length, 1)).padStart(2, "0")}
            </span>
          </div>

          <div className={styles.productPanel}>
            <p className={styles.eyebrow}>{model.brand || "BIZON TBR"}</p>
            <h2 id="product-stage-title">Создана для рабочей нагрузки</h2>
            <p>{model.descriptionLong || model.descriptionShort}</p>
            <dl className={styles.productFacts}>
              <div>
                <dt>Применение</dt>
                <dd>{application ?? model.applicationCategory}</dd>
              </div>
              <div>
                <dt>Позиция</dt>
                <dd>{axleLabels.join(" · ") || model.axlePosition || "Уточняется"}</dd>
              </div>
              <div>
                <dt>Протектор</dt>
                <dd>{model.treadType || "По спецификации"}</dd>
              </div>
            </dl>

            <CatalogBuyPanel
              baseItem={{
                itemType: "tire",
                itemId: model.id,
                name: model.name,
                slug: model.slug,
                parentSlug: model.tireTypeSlug,
                url: modelPath,
                quantity: 1,
                priceOnRequest: true,
              }}
              variants={variants.map((variant) => ({
                id: variant.id,
                label: variant.size,
                price: variant.price,
                priceOnRequest: variant.priceOnRequest,
              }))}
              sizeLabel="Типоразмер"
            />

            <p className={styles.disclaimer}>
              Финальную совместимость и наличие подтверждает специалист BIZON.
            </p>
          </div>
        </section>
      </div>

      {model.advantages.length > 0 && (
        <section className={styles.advantagesBlock} aria-labelledby="advantages-title">
          <div className={styles.advantagesIntro}>
            <p className={styles.eyebrow}>Инженерная логика</p>
            <h2 id="advantages-title">Преимущества модели</h2>
          </div>
          <ModelAdvantagesCarousel advantages={model.advantages} />
        </section>
      )}

      <div className={styles.pageInner}>
        <TireVariantsTable model={model} variants={variants} modelPath={modelPath} />

        {model.documents.length > 0 && (
          <section className={styles.documents} aria-labelledby="documents-title">
            <h2 id="documents-title">Документы</h2>
            <div>
              {model.documents.map((document) => (
                <a key={document.url} href={document.url} target="_blank" rel="noreferrer">
                  <span>{document.title}</span>
                  <span aria-hidden="true">PDF ↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className={styles.finalCta}>
          <div>
            <p className={styles.eyebrow}>Нужна консультация?</p>
            <h2>Проверим модель под вашу технику и маршрут</h2>
          </div>
          <Link className="btn-secondary" href={contactHref}>
            Связаться со специалистом
          </Link>
        </section>
      </div>
    </main>
  );
}
