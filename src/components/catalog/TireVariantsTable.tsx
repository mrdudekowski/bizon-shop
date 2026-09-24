import Link from "next/link";
import type { CmsTireModel, CmsTireVariant } from "@/lib/content/types";

import styles from "./CatalogSpecsTable.module.css";

type TireVariantsTableProps = {
  model: CmsTireModel;
  variants: CmsTireVariant[];
  modelPath: string;
};

function cell(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

const FACT_COLUMNS: Array<{
  key: keyof CmsTireVariant;
  label: string;
  secondary?: boolean;
}> = [
  { key: "rimDiameter", label: "Обод" },
  { key: "loadIndex", label: "LI" },
  { key: "loadIndexDual", label: "LI dual" },
  { key: "speedIndex", label: "SI" },
  { key: "plyRating", label: "PR" },
  { key: "overallDiameter", label: "OD, мм" },
  { key: "sectionWidth", label: "Ширина, мм", secondary: true },
  { key: "treadDepth", label: "Протектор, мм", secondary: true },
  { key: "pressureSingleKpa", label: "Давл. од., кПа", secondary: true },
  { key: "pressureDualKpa", label: "Давл. сд., кПа", secondary: true },
  { key: "maxLoadSingleKg", label: "Нагр. од., кг", secondary: true },
  { key: "maxLoadDualKg", label: "Нагр. сд., кг", secondary: true },
  { key: "recommendedRim", label: "Рек. обод", secondary: true },
];

export function TireVariantsTable({ model, variants }: TireVariantsTableProps) {
  if (variants.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Технические параметры размеров</h2>
        <p className={styles.empty}>
          Типоразмеры для этой модели уточняются.{" "}
          <Link
            href={`/contact?model=${encodeURIComponent(model.slug)}&type=${encodeURIComponent(model.tireTypeSlug)}`}
            className="underline"
          >
            Связаться со специалистом
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="tire-specs-title">
      <h2 className={styles.title} id="tire-specs-title">
        Технические параметры размеров
      </h2>

      <div className={styles.cards}>
        {variants.map((variant) => (
          <article className={styles.card} key={variant.id}>
            <h3 className={styles.cardSize}>{variant.size}</h3>
            <dl className={styles.cardFacts}>
              {FACT_COLUMNS.map((column) => (
                <div key={column.key}>
                  <dt>{column.label}</dt>
                  <dd>{cell(variant[column.key] as string | number | undefined)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className={`${styles.scroll} ${styles.scrollWide}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.stickyCol} ${styles.colSize}`} scope="col">
                Размер
              </th>
              {FACT_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={`${styles.colNarrow} ${column.secondary ? styles.secondary : ""}`}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id}>
                <th className={`${styles.stickyCol} ${styles.colSize}`} scope="row">
                  {variant.size}
                </th>
                {FACT_COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={`${styles.colNarrow} ${column.secondary ? styles.secondary : ""}`}
                  >
                    {cell(variant[column.key] as string | number | undefined)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
