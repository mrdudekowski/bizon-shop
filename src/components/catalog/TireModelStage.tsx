import Link from "next/link";

import { CatalogBuyPanel } from "@/components/catalog/CatalogBuyPanel";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { LexicalContent } from "@/components/content/LexicalContent";
import { CatalogProductGallery } from "@/components/catalog/CatalogProductGallery";
import { ModelAdvantagesCarousel } from "@/components/catalog/ModelAdvantagesCarousel";
import { PageHeader } from "@/components/catalog/PageHeader";
import { TireVariantsTable } from "@/components/catalog/TireVariantsTable";
import { getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import type { TireCatalogModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireVariant } from "@/lib/content/types";
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
  const evidenceDocuments = model.documents.filter(
    (document) => Boolean(document.url?.trim() && document.title?.trim()),
  );

  return (
    <div className={styles.modelPage} data-main-chrome-tone="light">
      <div className={`${styles.pageInner} ${styles.pageInnerBeforeAdvantages}`}>
        <PageHeader
          title={model.name}
          description={model.descriptionShort}
          breadcrumbs={breadcrumbs}
        />

        <section className={styles.productStage} aria-labelledby="product-stage-title">
          <CatalogProductGallery
            images={gallery}
            fallbackKey={model.slug}
            alt={`${model.name} — грузовая шина`}
          />

          <div className={styles.productPanel}>
            <p className={styles.eyebrow}>{model.brand || "BIZON TBR"}</p>
            <h2 id="product-stage-title">Под рабочую нагрузку и ваш маршрут</h2>
            <LexicalContent data={model.descriptionLong || model.descriptionShort} />
            <p>
              Подтвердите применение, ось и типоразмер перед заказом — эти параметры
              определяют пригодность модели для вашей техники.
            </p>
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
              Таблица типоразмеров и документы помогают проверить конфигурацию. Финальную
              совместимость, наличие и предложение подтверждает специалист BIZON.
            </p>
          </div>
        </section>
      </div>

      {model.advantages.length > 0 && (
        <section className={styles.advantagesBlock}>
          <ModelAdvantagesCarousel advantages={model.advantages} />
        </section>
      )}

      <div className={styles.pageInner}>
        <TireVariantsTable model={model} variants={variants} modelPath={modelPath} />

        {evidenceDocuments.length > 0 && (
          <section className={styles.documents} aria-labelledby="documents-title" data-evidence-source="technical-documents">
            <h2 id="documents-title">Технические подтверждения</h2>
            <div>
              {evidenceDocuments.map((document) => (
                <a key={document.url} href={document.url} target="_blank" rel="noreferrer">
                  <span>{document.title}</span>
                  <span>PDF <SiteArrow direction="ne" /></span>
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
            Запросить наличие и предложение
          </Link>
        </section>
      </div>
    </div>
  );
}
