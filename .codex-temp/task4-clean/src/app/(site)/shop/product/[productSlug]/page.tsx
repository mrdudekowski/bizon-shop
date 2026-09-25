import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllShopProductSlugs, getShopProductBySlug } from "@/lib/cms";
import { createProductMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";
import { PageHeader } from "@/components/catalog/PageHeader";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductQuickOrderForm } from "@/components/forms/ContactForm";

type PageProps = {
  params: Promise<{ productSlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllShopProductSlugs();
  return slugs.map((productSlug) => ({ productSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { productSlug } = await params;
  const product = await getShopProductBySlug(productSlug);
  if (!product) return {};
  return createProductMetadata(product);
}

export default async function ProductPage({ params }: PageProps) {
  const { productSlug } = await params;
  const product = await getShopProductBySlug(productSlug);

  if (!product) {
    notFound();
  }

  const structuredData = createProductStructuredData({
    name: product.name,
    description: product.descriptionShort,
    path: `/shop/product/${product.slug}`,
    brand: product.brand,
    category: product.categorySlug,
  });

  return (
    <div className="section-inner">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageHeader
        title={product.name}
        description={product.descriptionShort}
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/shop", label: "Магазин" },
          { href: `/shop/${product.categorySlug}`, label: product.categorySlug.toUpperCase() },
          { href: `/shop/product/${product.slug}`, label: product.name },
        ]}
      />
      <article className="card-base info-card max-w-3xl">
        <p className="info-card-text">{product.descriptionLong}</p>
      </article>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <AddToCartButton
          item={{
            itemType: "shopProduct",
            itemId: product.id,
            name: product.name,
            slug: product.slug,
            url: `/shop/product/${product.slug}`,
            quantity: 1,
            priceOnRequest: true,
          }}
        />
      </div>
      <div className="mt-8">
        <ProductQuickOrderForm
          productSlug={product.slug}
          productName={product.name}
          productUrl={`/shop/product/${product.slug}`}
          productId={product.id}
        />
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/contact" className="btn-accent inline-flex">
          Запросить цену
        </Link>
      </div>
    </div>
  );
}
