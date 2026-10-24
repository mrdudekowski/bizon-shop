"use client";

import { useEffect, useState } from "react";
import { EditorialListing } from "@/components/content/EditorialListing";
import type { CmsArticle } from "@/lib/content/types";
import { fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";
import { resolveTireIqArticleCover } from "@/lib/content/tireIqVisuals";
import type { ReactNode } from "react";

export function TireIqListingRuntime({ articles: initialArticles, beforeContent }: {
  articles: CmsArticle[];
  beforeContent: ReactNode;
}) {
  const [articles, setArticles] = useState(initialArticles);
  useEffect(() => {
    const controller = new AbortController();
    void fetchBrowserPublishedList<CmsArticle>("/v1/articles", controller.signal)
      .then(setArticles)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn("Could not refresh Tire IQ articles; showing generated content.", error);
      });
    return () => controller.abort();
  }, []);

  return <EditorialListing
    kicker="Инженерные решения для подбора и эксплуатации"
    title="Tire IQ"
    description="Методики подбора, диагностики и эксплуатации шин для fleet-операторов и технических специалистов."
    breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/tire-iq", label: "Tire IQ" }]}
    beforeContent={beforeContent}
    items={articles.map((article) => {
      const imageUrl = resolveTireIqArticleCover(article);
      return {
        key: article.slug,
        href: `/tire-iq/${article.slug}`,
        title: article.title,
        description: article.excerpt,
        meta: article.publishedAt,
        taxonomy: article.taxonomy,
        imageUrl,
        showImage: imageUrl !== null,
        imageAlt: article.title,
        fallbackKey: article.slug,
      };
    })}
    emptyMessage="Опубликованных статей Tire IQ пока нет."
  />;
}
