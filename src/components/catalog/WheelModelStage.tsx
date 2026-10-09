import { WheelOrderPanel } from "@/components/catalog/WheelOrderPanel";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { LexicalContent } from "@/components/content/LexicalContent";
import { CatalogProductGallery } from "@/components/catalog/CatalogProductGallery";
import { PageHeader } from "@/components/catalog/PageHeader";
import { WheelVariantsTable } from "@/components/catalog/WheelVariantsTable";
import { getWheelConstructionMethodLabel } from "@/lib/content/wheelConstructionMethod";
import type { CmsWheelModel, CmsWheelType, CmsWheelVariant } from "@/lib/content/types";

import styles from "./TireCatalog.module.css";

type WheelModelStageProps = {
  wheelType: CmsWheelType;
  model: CmsWheelModel;
  variants: CmsWheelVariant[];
  modelPath: string;
};

export function WheelModelStage({
  wheelType,
  model,
  variants,
  modelPath,
}: WheelModelStageProps) {
  const typeBasePath = `/shop/wheels/${wheelType.slug}`;
  const gallery = [
    model.imageUrl,
    ...model.gallery.map((image) => image.url),
  ].filter(
    (url, index, values): url is string => Boolean(url) && values.indexOf(url) === index,
  );
  const evidenceDocuments = (model.documents ?? []).filter(
    (document) => Boolean(document.url?.trim() && document.title?.trim()),
  );

  return (
    <div className={styles.modelPage} data-main-chrome-tone="light">
      <div className={styles.pageInner}>
        <PageHeader
          title={model.name}
          description={model.descriptionShort}
          breadcrumbs={[
            { href: "/", label: "Главная" },
            { href: "/shop", label: "Магазин" },
            { href: typeBasePath, label: wheelType.name },
            { href: modelPath, label: model.name },
          ]}
        />

        <section className={styles.productStage} aria-label={model.name}>
          <CatalogProductGallery
            images={gallery}
            fallbackKey={model.slug}
            alt={`${model.name} — диск BIZON`}
          />

          <div className={styles.productPanel}>
            <p className={styles.eyebrow}>{model.series || wheelType.name}</p>
            <LexicalContent data={model.descriptionLong || model.descriptionShort} />
            <p>
              Укажите параметры диска. Специалист проверит совместимость и сообщит стоимость
              до оформления заявки.
            </p>
            <dl className={styles.productFacts}>
              <div>
                <dt>Конструкция</dt>
                <dd>
                  {getWheelConstructionMethodLabel(model.constructionMethod) || "—"}
                </dd>
              </div>
              <div>
                <dt>Материал</dt>
                <dd>{model.material || "—"}</dd>
              </div>
              <div>
                <dt>Стиль</dt>
                <dd>{model.designStyle || "—"}</dd>
              </div>
            </dl>

            <WheelOrderPanel
              baseItem={{
                itemType: "wheel",
                itemId: model.id,
                name: model.name,
                slug: model.slug,
                parentSlug: model.wheelTypeSlug,
                url: modelPath,
                priceOnRequest: true,
              }}
              variants={variants.map((variant) => ({
                id: variant.id,
                label: variant.sizeLabel,
                price: variant.price,
                priceOnRequest: variant.priceOnRequest,
              }))}
              finish={model.series?.trim() || ""}
            />

            <p className={styles.disclaimer}>
              {model.fitmentNotes ||
                "Технические параметры и документы помогают проверить конфигурацию. Финальную совместимость подтверждает специалист BIZON."}
            </p>
          </div>
        </section>

        <WheelVariantsTable model={model} variants={variants} modelPath={modelPath} />

        {evidenceDocuments.length > 0 && (
          <section
            className={styles.documents}
            aria-labelledby="wheel-documents-title"
            data-evidence-source="technical-documents"
          >
            <h2 id="wheel-documents-title">Технические подтверждения</h2>
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
      </div>
    </div>
  );
}
