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

function pairCell(
  single: string | number | null | undefined,
  dual: string | number | null | undefined,
): string {
  const s = single != null && single !== "" ? String(single) : "";
  const d = dual != null && dual !== "" ? String(dual) : "";
  if (!s && !d) return "—";
  if (s && d) return `${s} / ${d}`;
  return s || d;
}

type SpecColumn = {
  key: string;
  label: string;
  render: (variant: CmsTireVariant) => string;
};

const SPEC_COLUMNS: readonly SpecColumn[] = [
  { key: "rimDiameter", label: "Обод", render: (v) => cell(v.rimDiameter) },
  { key: "recommendedRim", label: "Рек. обод", render: (v) => cell(v.recommendedRim) },
  { key: "loadIndex", label: "LI (од./сд.)", render: (v) => pairCell(v.loadIndex, v.loadIndexDual) },
  { key: "speedIndex", label: "SI", render: (v) => cell(v.speedIndex) },
  { key: "plyRating", label: "PR", render: (v) => cell(v.plyRating) },
  { key: "overallDiameter", label: "OD, мм", render: (v) => cell(v.overallDiameter) },
  { key: "sectionWidth", label: "Ширина, мм", render: (v) => cell(v.sectionWidth) },
  { key: "treadDepth", label: "Протектор, мм", render: (v) => cell(v.treadDepth) },
  {
    key: "pressure",
    label: "Давление, кПа",
    render: (v) => pairCell(v.pressureSingleKpa, v.pressureDualKpa),
  },
  {
    key: "maxLoad",
    label: "Нагрузка, кг",
    render: (v) => pairCell(v.maxLoadSingleKg, v.maxLoadDualKg),
  },
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
            <header className={styles.cardHeader}>
              <h3 className={styles.cardSize}>{variant.size}</h3>
            </header>
            <dl className={styles.cardFacts}>
              {SPEC_COLUMNS.map((column) => (
                <div key={column.key}>
                  <dt>{column.label}</dt>
                  <dd>{column.render(variant)}</dd>
                </div>
              ))}
            </dl>
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
              {SPEC_COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id}>
                <th className={styles.colSize} scope="row">
                  {variant.size}
                </th>
                {SPEC_COLUMNS.map((column) => (
                  <td key={column.key}>{column.render(variant)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
