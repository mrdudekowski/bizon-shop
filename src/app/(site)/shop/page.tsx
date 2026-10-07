import Image from "next/image";
import Link from "next/link";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ShopCategoryShowcase } from "@/components/shop/ShopCategoryShowcase";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { getPageContent, getShopCategories, getWheelModelsByTypeSlug } from "@/lib/content";
import { loadPublished } from "@/lib/content/loadPublished";
import { shopHomeCarouselSlides, shopHomeCategoryCards } from "@/lib/content/shopCategoryPresentation";
import { createPageMetadata } from "@/lib/seo/metadata";
import styles from "./ShopHome.module.css";

export async function generateMetadata() {
  const page = await getPageContent("shop-home");
  return createPageMetadata({
    title: page.seoTitle || "BIZON Shop",
    description:
      page.seoDescription ||
      "Кованые диски BIZON под заказ, аксессуары и outdoor-товары.",
    path: "/shop",
  });
}

export default async function ShopPage() {
  const loaded = await loadPublished(() => Promise.all([
    getPageContent("shop-home"),
    getWheelModelsByTypeSlug("forged"),
    getShopCategories(),
  ]));
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  const [page, forgedModels, shopCategories] = loaded.value;

  const forgedModelsBySlug = new Map(forgedModels.map((model) => [model.slug, model]));
  const homeModels = [...forgedModelsBySlug.values()]
    .filter((model) => model.showInMenu && model.imageUrl)
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .slice(0, 3);
  const categorySlides = shopHomeCarouselSlides(shopCategories);
  const categoryCards = shopHomeCategoryCards(shopCategories);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-shop-chrome-tone="dark">
        <div className={styles.heroMedia}>
          <Image
            src={page.hero.imageUrl}
            alt={page.hero.imageAlt}
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{page.hero.eyebrow}</p>
          <h1>{page.hero.title}</h1>
          <p className={styles.heroLead}>{page.hero.lead}</p>
          <Link className={styles.heroAction} href={page.hero.cta.href}>
            {page.hero.cta.label}
          </Link>
        </div>
      </section>

      <section
        className={styles.modelsSection}
        id="wheels"
        data-shop-chrome-tone="dark"
        aria-labelledby="shop-title"
      >
        <div className={styles.content}>
          <div className={styles.modelsIntro}>
            <p className={styles.collectionKicker}>{page.wheelsIntro.kicker}</p>
            <h2 id="shop-title">{page.wheelsIntro.title}</h2>
            <p>{page.wheelsIntro.lead}</p>
          </div>

          <div className={styles.modelGrid}>
            {homeModels.map((model) => (
              <Link
                className={styles.modelCard}
                href={`/shop/wheels/forged/${model.slug}`}
                key={model.slug}
              >
                <span className={styles.modelMedia}>
                  <Image
                    src={model.imageUrl!}
                    alt={model.name}
                    fill
                    sizes="(max-width: 767px) 92vw, 33vw"
                  />
                </span>
                <span className={styles.modelContent}>
                  <span className={styles.modelStatus}>Изготавливается под заказ</span>
                  <strong>{model.name}</strong>
                  <span>
                    {[model.designStyle, model.series].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className={styles.modelArrow} aria-hidden="true">
                  <SiteArrow direction="ne" />
                </span>
              </Link>
            ))}
          </div>

          <div
            className={styles.orderSteps}
            aria-label="Как заказать кованые диски BIZON"
          >
            {page.orderSteps.map((step, index) => (
              <article key={`${step.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.categoriesSection} id="categories" data-shop-chrome-tone="dark" aria-labelledby="categories-title">
        {categorySlides.length || categoryCards.length ? (
          <ShopCategoryShowcase slides={categorySlides} cards={categoryCards} />
        ) : (
          <div className={styles.content}>
            <div className={styles.categoriesEmpty}>
              <p>Категории появятся здесь после публикации в каталоге.</p>
              <Link href="/shop/wheels/forged">Посмотреть кованые диски <SiteArrow direction="ne" /></Link>
            </div>
          </div>
        )}
      </section>

      <section
        className={styles.vehiclesSection}
        data-shop-section="vehicles"
        data-shop-chrome-tone="light"
        aria-labelledby="vehicles-title"
      >
        <div className={styles.vehiclesInner}>
          <div className={styles.vehiclesHead}>
            <div>
              <p className={styles.darkKicker}>{page.vehicles.eyebrow}</p>
              <h2 id="vehicles-title">{page.vehicles.title}</h2>
              <p>{page.vehicles.lead}</p>
            </div>
            <Link className={styles.selectionAction} href={page.vehicles.cta.href}>
              {page.vehicles.cta.label}
            </Link>
          </div>

          <div className={styles.vehicleGrid}>
            {page.vehicles.slides.map((story, index) => (
              <figure
                className={index < 2 ? styles.vehicleFeature : styles.vehicleCard}
                key={`${story.image}-${index}`}
              >
                <Image
                  src={story.image}
                  alt={story.alt}
                  fill
                  sizes={
                    index < 2
                      ? "(max-width: 767px) 100vw, 50vw"
                      : "(max-width: 767px) 100vw, 33vw"
                  }
                />
                <figcaption>{story.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
