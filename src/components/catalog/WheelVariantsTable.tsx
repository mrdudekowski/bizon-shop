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
            <h3 className={styles.cardSize}>{formatSize(variant)}</h3>
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
                <dt>Цвет</dt>
                <dd>{cell(variant.color)}</dd>
              </div>
              <div>
                <dt>Покрытие</dt>
                <dd>{cell(variant.finish)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.stickyCol} ${styles.colSize}`} scope="col">
                Размер
              </th>
              <th className={styles.colMid} scope="col">
                PCD
              </th>
              <th className={styles.colNarrow} scope="col">
                ET
              </th>
              <th className={styles.colNarrow} scope="col">
                DIA
              </th>
              <th className={styles.colMid} scope="col">
                Нагрузка
              </th>
              <th className={`${styles.colMid} ${styles.secondary}`} scope="col">
                Цвет
              </th>
              <th className={`${styles.colWide} ${styles.secondary}`} scope="col">
                Покрытие
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id}>
                <th className={`${styles.stickyCol} ${styles.colSize}`} scope="row">
                  {formatSize(variant)}
                </th>
                <td className={styles.colMid}>{cell(variant.pcd)}</td>
                <td className={styles.colNarrow}>{cell(variant.offsetET)}</td>
                <td className={styles.colNarrow}>{cell(variant.centerBore)}</td>
                <td className={styles.colMid}>{cell(variant.loadRating)}</td>
                <td className={`${styles.colMid} ${styles.secondary}`}>
                  {cell(variant.color)}
                </td>
                <td className={`${styles.colWide} ${styles.secondary}`}>
                  {cell(variant.finish)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
