import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";

import styles from "./CatalogSpecsTable.module.css";

type WheelVariantsTableProps = {
  model: CmsWheelModel;
  variants: CmsWheelVariant[];
  modelPath: string;
};

function formatSize(variant: CmsWheelVariant): string {
  if (variant.diameter != null && variant.width != null) {
    return `${variant.diameter}×${variant.width}`;
  }
  return variant.sizeLabel;
}

function cell(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function extendedSpecs(variant: CmsWheelVariant): Array<[string, string]> {
  return [
    ["Артикул", cell(variant.sku)],
    ["Количество отверстий", cell(variant.boltHoles)],
    ["PCD, мм", cell(variant.pcdMm)],
    ["Вес, кг", cell(variant.weight)],
    ["Тип крепежа", cell(variant.fastenerType)],
    ["Материал крепежа", cell(variant.fastenerMaterial)],
    ["Совместимые размеры шин", cell(variant.compatibleTireSizes)],
    ["Источник спецификации", cell(variant.sourceSpecification)],
    ["Цена", variant.priceOnRequest ? "По запросу" : cell(variant.price)],
  ];
}

function ExtendedSpecs({ variant }: { variant: CmsWheelVariant }) {
  return (
    <details className={styles.secondaryDisclosure}>
      <summary>Все характеристики</summary>
      <dl className={styles.cardFacts}>
        {extendedSpecs(variant).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function WheelVariantsTable({ variants }: WheelVariantsTableProps) {
  if (variants.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Технические параметры</h2>
        <p className={styles.empty}>
          Размеры для этой модели скоро появятся. Оставьте заявку выше — специалист поможет с подбором.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="wheel-specs-title">
      <h2 className={styles.title} id="wheel-specs-title">
        Технические параметры
      </h2>

      <div className={styles.cards}>
        {variants.map((variant) => (
          <article className={styles.card} key={variant.id}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardSize}>{formatSize(variant)}</h3>
              {variant.sku ? <span className={styles.cardSku}>{variant.sku}</span> : null}
            </header>
            <dl className={styles.cardFacts}>
              <div>
                <dt>PCD</dt>
                <dd>{cell(variant.pcd)}</dd>
              </div>
              <div>
                <dt>ET</dt>
                <dd>{cell(variant.offsetET)}</dd>
              </div>
              <div>
                <dt>DIA</dt>
                <dd>{cell(variant.centerBore)}</dd>
              </div>
              <div>
                <dt>Нагрузка</dt>
                <dd>{cell(variant.loadRating)}</dd>
              </div>
              <div>
                <dt>Вес, кг</dt>
                <dd>{cell(variant.weight)}</dd>
              </div>
              <div>
                <dt>Отверстия</dt>
                <dd>{cell(variant.boltHoles)}</dd>
              </div>
              <div>
                <dt>Цвет</dt>
                <dd>{cell(variant.color)}</dd>
              </div>
              <div>
                <dt>Покрытие</dt>
                <dd>{cell(variant.finish)}</dd>
              </div>
              {variant.fastenerType ? (
                <div>
                  <dt>Тип крепежа</dt>
                  <dd>{cell(variant.fastenerType)}</dd>
                </div>
              ) : null}
              {variant.compatibleTireSizes ? (
                <div>
                  <dt>Совместимые шины</dt>
                  <dd>{cell(variant.compatibleTireSizes)}</dd>
                </div>
              ) : null}
            </dl>
            <ExtendedSpecs variant={variant} />
          </article>
        ))}
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSize} scope="col">
                Размер
              </th>
              <th scope="col">PCD</th>
              <th scope="col">ET</th>
              <th scope="col">DIA</th>
              <th scope="col">Нагрузка</th>
              <th scope="col">Вес, кг</th>
              <th scope="col">Цвет</th>
              <th scope="col">Покрытие</th>
              <th scope="col">Спецификация</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id}>
                <th className={styles.colSize} scope="row">
                  {formatSize(variant)}
                </th>
                <td>{cell(variant.pcd)}</td>
                <td>{cell(variant.offsetET)}</td>
                <td>{cell(variant.centerBore)}</td>
                <td>{cell(variant.loadRating)}</td>
                <td>{cell(variant.weight)}</td>
                <td>{cell(variant.color)}</td>
                <td>{cell(variant.finish)}</td>
                <td>
                  <ExtendedSpecs variant={variant} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
