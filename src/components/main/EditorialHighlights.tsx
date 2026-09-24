import Image from "next/image";
import Link from "next/link";

import { CatalogImage } from "@/components/catalog/CatalogImage";
import { PREMIUM_MEDIA } from "@/constants/images";
import type { CmsArticle, CmsStory } from "@/lib/content/types";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function EditorialHighlights({
  article,
  story,
  content,
}: {
  article?: CmsArticle;
  story?: CmsStory;
  content: PageShell;
}) {
  return (
    <div className={styles.editorial}>
      <div className={styles.inner}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2 id="expertise-support-title">{content.title}</h2>
          <p>{content.lead}</p>
        </div>
        <div className={styles.editorialGrid}>
          {article && (
            <article>
              <Link className={styles.editorialMedia} href={`/tire-iq/${article.slug}`}>
                <CatalogImage
                  src={article.imageUrl}
                  fallbackKey={article.slug}
                  alt={article.title}
                  fill
                  sizes="(max-width: 767px) 100vw, 60vw"
                />
              </Link>
              <p className={styles.eyebrow}>Tire IQ</p>
              <h3>
                <Link href={`/tire-iq/${article.slug}`}>{article.title}</Link>
              </h3>
              <p>{article.excerpt}</p>
            </article>
          )}
          {story && (
            <article>
              <Link
                className={styles.editorialMedia}
                href={`/people-stories/${story.slug}`}
              >
                <CatalogImage
                  src={story.imageUrl}
                  fallbackKey={story.slug}
                  alt={story.title}
                  fill
                  sizes="(max-width: 767px) 100vw, 40vw"
                />
              </Link>
              <p className={styles.eyebrow}>People Stories</p>
              <h3>
                <Link href={`/people-stories/${story.slug}`}>{story.title}</Link>
              </h3>
              <p>{story.excerpt}</p>
            </article>
          )}
          {!article && !story && (
            <div className={styles.editorialEmpty}>
              <Image
                src={PREMIUM_MEDIA.inspection}
                alt="Проверка протектора шины"
                fill
                sizes="100vw"
              />
              <p>Материалы готовятся к публикации</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
