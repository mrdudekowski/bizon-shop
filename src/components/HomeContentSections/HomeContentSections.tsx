import Image from "next/image";
import Link from "next/link";

import { CatalogCard } from "@/components/catalog/CatalogCard";
import { PREMIUM_MEDIA } from "@/constants/images";
import type { CmsArticle, CmsTireModel } from "@/lib/content/types";
import { getModelApplicationCategories, getModelApplicationLabels } from "@/lib/catalog/tireCategories";

type HomeContentSectionsProps = {
  tbrModels: CmsTireModel[];
  articles: CmsArticle[];
};

function getModelHref(model: CmsTireModel) {
  const category = getModelApplicationCategories(model)[0];
  const typePath = `/models/${model.tireTypeSlug}`;

  return `${typePath}${category ? `/${category.slug}` : ""}/${model.slug}`;
}

export function HomeContentSections({ tbrModels, articles }: HomeContentSectionsProps) {
  const featuredModels = tbrModels.slice(0, 3);
  const editorialItems = [
    ...articles.slice(0, 1).map((article) => ({
      key: `article-${article.slug}`,
      href: `/tire-iq/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      meta: "Tire IQ",
      imageUrl: article.imageUrl,
      fallbackKey: "tire-pressure-fleet",
    })),
  ];

  return (
    <>
      <section className="section section--muted" aria-labelledby="featured-tbr-heading">
        <div className="section-heading">
          <p className="section-kicker">В фокусе</p>
          <h2 id="featured-tbr-heading" className="section-title">Популярные TBR-модели</h2>
          <p className="section-description">Отправная точка для подбора по технике, оси и условиям эксплуатации.</p>
        </div>
        {featuredModels.length > 0 ? (
          <div className="section-grid">
            {featuredModels.map((model) => (
              <CatalogCard
                key={model.id}
                href={getModelHref(model)}
                title={model.name}
                description={model.descriptionShort}
                meta={getModelApplicationLabels(model).join(" · ") || model.tireTypeName}
                imageUrl={model.imageUrl}
                imageAlt={model.name}
                mediaKey={model.slug}
              />
            ))}
          </div>
        ) : (
          <div className="card-base info-card">
            <h3 className="info-card-title">Каталог пополняется</h3>
            <p className="info-card-text">Модели и технические характеристики будут опубликованы после проверки данных командой BIZON.</p>
            <Link href="/models/tbr" className="btn-secondary w-fit">Открыть каталог TBR</Link>
          </div>
        )}
      </section>

      <section className="section section--dark" aria-labelledby="branding-promo-heading">
        <div className="section-grid">
          <div className="catalog-detail-media catalog-detail-media--editorial">
            <Image
              src={PREMIUM_MEDIA.mounting}
              alt="Специалист готовит шину к индивидуальному брендированию"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="catalog-image"
            />
          </div>
          <div className="info-card" style={{ alignContent: "center" }}>
            <p className="section-kicker">BIZON Business</p>
            <h2 id="branding-promo-heading" className="section-title">Индивидуальное брендирование</h2>
            <p className="section-description">Отдельный B2B-сценарий для компаний: обсудить задачу, согласовать параметры и получить расчёт.</p>
            <Link href="/branding" className="btn-accent w-fit">Обсудить брендирование</Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="knowledge-heading">
        <div className="section-heading">
          <p className="section-kicker">Знания и практика</p>
          <h2 id="knowledge-heading" className="section-title">Tire IQ</h2>
          <p className="section-description">Практические материалы для подбора и эксплуатации шин.</p>
        </div>
        {editorialItems.length > 0 ? (
          <div className="section-grid">
            {editorialItems.map((item) => (
              <CatalogCard
                key={item.key}
                href={item.href}
                title={item.title}
                description={item.description}
                meta={item.meta}
                imageUrl={item.imageUrl}
                imageAlt={item.title}
                mediaKey={item.fallbackKey}
              />
            ))}
          </div>
        ) : (
          <div className="section-grid">
            <article className="card-base info-card">
              <h3 className="info-card-title">Tire IQ</h3>
              <p className="info-card-text">Здесь появятся методики подбора и эксплуатации после редакционной подготовки материалов.</p>
              <Link href="/tire-iq" className="btn-secondary w-fit">Перейти в Tire IQ</Link>
            </article>
          </div>
        )}
      </section>

      <section className="section section--muted" aria-labelledby="trust-heading">
        <div className="section-heading">
          <p className="section-kicker">Партнёрство</p>
          <h2 id="trust-heading" className="section-title">Документы, гарантия и работа с поставщиками</h2>
          <p className="section-description">Разделы готовы к наполнению подтверждёнными документами и согласованными данными партнёров.</p>
        </div>
        <div className="section-grid">
          <article className="card-base info-card">
            <h3 className="info-card-title">Гарантия и документы</h3>
            <p className="info-card-text">Условия гарантии и подтверждающие материалы публикуются после проверки юридической и продуктовой командами.</p>
            <Link href="/warranty" className="btn-secondary w-fit">Открыть гарантию</Link>
          </article>
          <article className="card-base info-card">
            <h3 className="info-card-title">Стать поставщиком</h3>
            <p className="info-card-text">Оставьте B2B-заявку: команда BIZON уточнит ассортимент, географию и формат сотрудничества.</p>
            <Link href="/become-a-supplier" className="btn-secondary w-fit">Стать поставщиком</Link>
          </article>
        </div>
      </section>
    </>
  );
}
