import Link from "next/link";
import { useState } from "react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { buildSelectionCartItem } from "@/lib/cart/selectionCartItem";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { SelectionResult as SelectionResultValue, SelectionState } from "@/lib/selection/types";
import { serializeSelectionParams } from "@/lib/selection/urlState";

import styles from "./Selection.module.css";

export function SelectionResult({
  result,
  catalog,
  state,
}: {
  result: SelectionResultValue;
  catalog: TireCatalogReadModel;
  state: SelectionState;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const models = new Map(
    catalog.directions.flatMap((direction) =>
      direction.models.map((model) => [model.slug, model] as const),
    ),
  );
  const contactParams = serializeSelectionParams(state);
  for (const slug of selected) contactParams.append("model", slug);
  const contactHref = `/contact?${contactParams.toString()}`;
  const selectedModels = selected.flatMap((slug) => {
    const model = models.get(slug);
    return model ? [{ slug, name: model.name }] : [];
  });
  const cartItem = buildSelectionCartItem(state, selectedModels);

  const toggleModel = (slug: string) => {
    setSelected((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug].slice(0, 3),
    );
  };

  return (
    <section className={styles.result} aria-labelledby="selection-result-title">
      <p className={styles.eyebrow}>Результат подбора</p>
      <h2 id="selection-result-title">Предварительная рекомендация</h2>

      {result.kind === "matches" ? (
        <>
          <p className={styles.resultLead}>Нашли модели с наиболее близким совпадением по опубликованным данным. Отметьте те, которые хотите передать специалисту.</p>
          <div className={styles.resultList}>
            {result.matches.map((match) => {
              const model = models.get(match.modelSlug);
              if (!model) return null;
              return (
                <article key={match.modelId}>
                  <label className={styles.resultSelect}>
                    <input type="checkbox" checked={selected.includes(match.modelSlug)} onChange={() => toggleModel(match.modelSlug)} />
                    <span>Добавить в запрос</span>
                  </label>
                  <p className={styles.eyebrow}>{model.brand} · {model.tireTypeName}</p>
                  <h2><Link href={match.href}>{model.name}</Link></h2>
                  <ul>{match.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  <Link className={styles.modelLink} href={match.href}>Изучить модель <span aria-hidden="true">↗</span></Link>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.consultation}>
          <h2>Нужна инженерная проверка</h2>
          <p>{result.reason}. Мы передадим исходные параметры специалисту и не будем подменять проверку случайной моделью.</p>
          {result.directionSlug && <Link href={`/models/${result.directionSlug}`}>Посмотреть ближайшее направление</Link>}
        </div>
      )}

      <div className={styles.resultHandoff}>
        <p>Финальную совместимость и наличие подтверждает специалист BIZON</p>
        <div className={styles.resultActions}>
          <AddToCartButton
            className="btn-accent"
            item={cartItem}
            label="Добавить подбор в корзину"
          />
          <Link className="btn-secondary" href={contactHref}>Задать общий вопрос</Link>
        </div>
      </div>
    </section>
  );
}
