"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TireModelStage } from "@/components/catalog/TireModelStage";
import { getModelApplicationCategories } from "@/lib/catalog/tireCategories";
import { getRuntimeModelHref, type TireCatalogModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireModel, CmsTireVariant } from "@/lib/content/types";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";

import styles from "./TireCatalog.module.css";

type RuntimeLoadState =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | { kind: "ready"; model: TireCatalogModel; variants: CmsTireVariant[]; breadcrumbs: { href: string; label: string }[] };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function RuntimeNotice({
  state,
  retry,
}: {
  state: Exclude<RuntimeLoadState, { kind: "ready" }>;
  retry: () => void;
}) {
  const invalid = state.kind === "invalid";
  const loading = state.kind === "loading";

  return (
    <main className={styles.catalogPage} data-main-chrome-tone="light">
      <div className={styles.pageInner}>
        <section className={styles.emptyState} aria-live="polite" role={loading ? "status" : "alert"}>
          <p className={styles.eyebrow}>{loading ? "Каталог BIZON" : "Модель шины"}</p>
          <h1>{loading ? "Загружаем модель" : invalid ? "Не указана модель" : "Не удалось загрузить страницу модели"}</h1>
          <p>
            {loading
              ? "Получаем актуальные данные опубликованной модели."
              : invalid
                ? "В ссылке не хватает направления или кода модели. Откройте модель из каталога шин."
                : "Проверьте подключение и повторите попытку. Опубликованные модели загружаются из каталога BIZON."}
          </p>
          <div className={styles.emptyActions}>
            {loading ? null : invalid ? (
              <Link className="btn-accent" href="/models/">Вернуться к каталогу шин</Link>
            ) : (
              <button className="btn-accent" type="button" onClick={retry}>Попробовать ещё раз</button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export function TireModelRuntimeRoute() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<RuntimeLoadState>({ kind: "loading" });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const typeSlug = query.get("type")?.trim() ?? "";
    const modelSlug = query.get("model")?.trim() ?? "";
    if (!slugPattern.test(typeSlug) || !slugPattern.test(modelSlug)) {
      setState({ kind: "invalid" });
      return;
    }

    const controller = new AbortController();
    const originalTitle = document.title;
    const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const originalDescription = descriptionMeta?.content;
    setState({ kind: "loading" });

    void (async () => {
      try {
        const model = await fetchBrowserPublishedJson<CmsTireModel>(
          `/v1/tires/models/${encodeURIComponent(typeSlug)}/${encodeURIComponent(modelSlug)}`,
          controller.signal,
        );
        const variants = await fetchBrowserPublishedList<CmsTireVariant>(
          `/v1/tires/models/${encodeURIComponent(model.id)}/variants`,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const href = getRuntimeModelHref(model);
        const runtimeModel: TireCatalogModel = {
          ...model,
          href,
          sizes: [...new Set(variants.map((variant) => variant.size))],
        };
        const category = getModelApplicationCategories(model)[0];
        const typePath = `/models/${model.tireTypeSlug}`;
        const breadcrumbs = [
          { href: "/", label: "Главная" },
          { href: "/models", label: "Каталог" },
          { href: typePath, label: model.tireTypeName },
          ...(category ? [{ href: `${typePath}/${category.slug}`, label: category.name }] : []),
          { href, label: model.name },
        ];

        document.title = model.seoTitle?.trim() || `${model.name} — шины BIZON`;
        if (descriptionMeta) {
          descriptionMeta.content = model.seoDescription?.trim() || model.descriptionShort;
        }
        setState({ kind: "ready", model: runtimeModel, variants, breadcrumbs });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Could not load published tire model from the runtime route.", error);
          setState({ kind: "unavailable" });
        }
      }
    })();

    return () => {
      controller.abort();
      document.title = originalTitle;
      if (descriptionMeta && originalDescription !== undefined) descriptionMeta.content = originalDescription;
    };
  }, [retryCount]);

  if (state.kind !== "ready") {
    return <RuntimeNotice state={state} retry={() => setRetryCount((count) => count + 1)} />;
  }

  return (
    <TireModelStage
      model={state.model}
      variants={state.variants}
      modelPath={state.model.href}
      breadcrumbs={state.breadcrumbs}
      refreshOnMount={false}
    />
  );
}
