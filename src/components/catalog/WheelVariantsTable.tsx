"use client";

import { Fragment, useState } from "react";

import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";
import { extraWheelSpecs, nextOpenSpec } from "@/components/catalog/wheelExtraSpecs";

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

function SpecChevron() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6.2 8 10.2 12 6.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpecToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle(): void;
}) {
  return (
    <button type="button" className={styles.specToggle} aria-expanded={open} onClick={onToggle}>
      Все характеристики
      <SpecChevron />
    </button>
  );
}

function SpecPanel({ variant }: { variant: CmsWheelVariant }) {
  return (
    <dl className={styles.specPanel}>
      {extraWheelSpecs(variant).map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function WheelVariantsTable({ variants }: WheelVariantsTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
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

  function toggle(id: string) {
    setOpenId((current) => nextOpenSpec(current, id));
  }

  return (
    <section className={styles.section} aria-labelledby="wheel-specs-title">
      <h2 className={styles.title} id="wheel-specs-title">
        Технические параметры
      </h2>

      <div className={styles.cards}>
        {variants.map((variant) => {
          const extras = extraWheelSpecs(variant);
          const open = openId === variant.id && extras.length > 0;
          return (
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
              </dl>
              {extras.length > 0 ? <SpecToggle open={open} onToggle={() => toggle(variant.id)} /> : null}
              {open ? <SpecPanel variant={variant} /> : null}
            </article>
          );
        })}
      </div>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSize} scope="col">Размер</th>
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
            {variants.map((variant) => {
              const extras = extraWheelSpecs(variant);
              const open = openId === variant.id && extras.length > 0;
              return (
                <Fragment key={variant.id}>
                  <tr>
                    <th className={styles.colSize} scope="row">{formatSize(variant)}</th>
                    <td>{cell(variant.pcd)}</td>
                    <td>{cell(variant.offsetET)}</td>
                    <td>{cell(variant.centerBore)}</td>
                    <td>{cell(variant.loadRating)}</td>
                    <td>{cell(variant.weight)}</td>
                    <td>{cell(variant.color)}</td>
                    <td>{cell(variant.finish)}</td>
                    <td>
                      {extras.length > 0 ? <SpecToggle open={open} onToggle={() => toggle(variant.id)} /> : "—"}
                    </td>
                  </tr>
                  {open ? (
                    <tr className={styles.specRow}>
                      <td colSpan={9}>
                        <SpecPanel variant={variant} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
