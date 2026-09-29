import Link from "next/link";

import { PageHeader } from "@/components/catalog/PageHeader";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import type { CmsProduct, CmsShopCategory } from "@/lib/content/types";
import styles from "./ShopProductCatalog.module.css";

export function ShopProductCatalog({
  category,
  products,
}: {
  category: CmsShopCategory;
  products: CmsProduct[];
}) {
  return (
    <div className={styles.page}>
      <PageHeader
        title={category.name}
        description={category.description}
        breadcrumbs={[
          { href: "/shop", label: "Shop" },
          { href: "/shop/categories", label: "Категории" },
          { href: `/shop/${category.slug}`, label: category.name },
        ]}
      />
      {products.length > 0 ? (
        <div className={styles.grid}>
          {products.map((product) => <ShopProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <section className={styles.empty}>
          <h2>Коллекция готовится</h2>
          <p>Товары и доступные варианты появятся после финального отбора.</p>
        </section>
      )}
      <p className={styles.back}><Link href="/shop/categories"><SiteArrow direction="left" /> Все категории</Link></p>
    </div>
  );
}
