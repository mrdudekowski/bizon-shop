import Image from "next/image";
import Link from "next/link";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { getPageContent, getShopCategories, getShopProducts, getWheelModelsByTypeSlug } from "@/lib/content";
import { shopProductCountLabel } from "@/lib/content/shopCategoryPresentation";
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
  const [page, forgedModels, shopCategories, shopProducts] = await Promise.all([
    getPageContent("shop-home"),
    getWheelModelsByTypeSlug("forged"),
    getShopCategories(),
    getShopProducts(),
  ]);

  const forgedModelsBySlug = new Map(forgedModels.map((model) => [model.slug, model]));
  const homeModels = [...forgedModelsBySlug.values()]
    .filter((model) => model.showInMenu && model.imageUrl)
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .slice(0, 3);
  const categories = shopCategories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      ...category,
      count: shopProducts.filter((product) => product.categorySlug === category.slug).length,
      image: category.imageUrl || shopProducts.find((product) => product.categorySlug === category.slug)?.imageUrl,
    }));

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
        <div className={styles.content}>
          <div className={styles.categoriesHead}>
            <div>
              <p className={styles.collectionKicker}>BIZON SHOP</p>
              <h2 id="categories-title">Категории товаров</h2>
              <p>Актуальные категории и ассортимент из каталога BIZON.</p>
            </div>
            <Link className={styles.categoriesAll} href="/shop/categories">Все категории <SiteArrow direction="ne" /></Link>
          </div>
          {categories.length ? (
            <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <Link className={styles.categoryCard} href={`/shop/${category.slug}`} key={category.slug}>
                  <span className={styles.categoryMedia}>
                    {category.image ? <Image src={category.image} alt="" fill sizes="(max-width: 639px) 88vw, (max-width: 900px) 46vw, 30vw" /> : null}
                    <span className={styles.categoryOverlay} />
                  </span>
                  <span className={styles.categoryInfo}>
                    <span>{shopProductCountLabel(category.count)}</span>
                    <strong>{category.name}</strong>
                    {category.description ? <span>{category.description}</span> : null}
                  </span>
                  <span className={styles.categoryArrow} aria-hidden="true"><SiteArrow direction="ne" /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.categoriesEmpty}>
              <p>Категории появятся здесь после публикации в каталоге.</p>
              <Link href="/shop/wheels/forged">Посмотреть кованые диски <SiteArrow direction="ne" /></Link>
            </div>
          )}
        </div>
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
