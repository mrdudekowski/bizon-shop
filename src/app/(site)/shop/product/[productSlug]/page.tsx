import { notFound } from "next/navigation";
import { getAllShopProductSlugs, getShopProductBySlug } from "@/lib/content";
import { createProductMetadata, productSearchDescription } from "@/lib/seo/metadata";
import {
  createBreadcrumbStructuredData,
  createProductStructuredData,
  jsonLdScriptContent,
  shopProductBreadcrumbs,
  visibleProductOffer,
} from "@/lib/seo/structuredData";
import { ShopProductConfigurator } from "@/components/shop/ShopProductConfigurator";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { loadPublished } from "@/lib/content/loadPublished";

type PageProps = {
  params: Promise<{ productSlug: string }>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(getAllShopProductSlugs);
  const slugs = loaded.kind === "ok" ? loaded.value : [];
  return slugs.map((productSlug) => ({ productSlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { productSlug } = await params;
  const loaded = await loadPublished(() => getShopProductBySlug(productSlug));
  if (loaded.kind === "unavailable") return {};
  const product = loaded.value;
  if (!product) return {};
  return createProductMetadata(product);
}

export default async function ProductPage({ params }: PageProps) {
  const { productSlug } = await params;
  const loaded = await loadPublished(() => getShopProductBySlug(productSlug));
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  const product = loaded.value;

  if (!product) {
    notFound();
  }

  const breadcrumbs = shopProductBreadcrumbs(product);
  const structuredData = createProductStructuredData({
    name: product.name,
    description: productSearchDescription(product),
    path: `/shop/product/${product.slug}`,
    brand: product.brand,
    category: product.categorySlug,
    image: product.imageUrl,
    sku: product.sku,
    offer: visibleProductOffer(product.price, product.priceOnRequest, product.available),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(createBreadcrumbStructuredData(breadcrumbs)) }}
      />
      <ShopProductConfigurator product={product} />
    </>
  );
}
