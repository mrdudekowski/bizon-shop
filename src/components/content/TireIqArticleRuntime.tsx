"use client";

import { useEffect, useState } from "react";
import { ArticleLayout } from "@/components/content/ArticleLayout";
import { LexicalContent } from "@/components/content/LexicalContent";
import { TireIqContextualVisuals } from "@/components/content/TireIqContextualVisuals";
import type { CmsArticle } from "@/lib/content/types";
import { fetchBrowserPublishedJson } from "@/lib/content/browserPublishedClient";
import { resolveTireIqArticleCover } from "@/lib/content/tireIqVisuals";
import { tireIqBreadcrumbs } from "@/lib/seo/structuredData";

function formatTireIqDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function TireIqArticleRuntime({ article: initialArticle }: { article: CmsArticle }) {
  const [article, setArticle] = useState(initialArticle);
  useEffect(() => {
    const controller = new AbortController();
    void fetchBrowserPublishedJson<CmsArticle>(`/v1/articles/${encodeURIComponent(initialArticle.slug)}`, controller.signal)
      .then(setArticle)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn("Could not refresh Tire IQ article; showing generated content.", error);
      });
    return () => controller.abort();
  }, [initialArticle.slug]);

  const imageUrl = resolveTireIqArticleCover(article);
  return <ArticleLayout
    kicker="Tire IQ"
    title={article.title}
    description={article.excerpt}
    breadcrumbs={tireIqBreadcrumbs(article)}
    meta={formatTireIqDate(article.publishedAt)}
    imageUrl={imageUrl}
    imageAlt={article.imageAlt ?? ""}
    imageFocalX={article.imageFocalX}
    imageFocalY={article.imageFocalY}
    imageFocalByViewport={article.imageFocalByViewport}
    fallbackKey={article.slug}
    backHref="/tire-iq"
    backLabel="Все статьи"
  >
    <TireIqContextualVisuals slug={article.slug} />
    <LexicalContent data={article.content} fallback={article.excerpt} />
  </ArticleLayout>;
}
