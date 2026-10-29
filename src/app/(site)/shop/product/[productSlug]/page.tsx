import { notFound } from "next/navigation";
import { getAllShopProductSlugs, getShopProductBySlug } from "@/lib/content";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
import { createProductMetadata } from "@/lib/seo/metadata";
import { createProductStructuredData } from "@/lib/seo/structuredData";
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
  const loaded = await loadPublished(async () => {
    const [product, contactPage] = await Promise.all([
      getShopProductBySlug(productSlug),
      getPublishedStubOverlay("contact"),
    ]);
    return { product, priceNotice: contactPage?.siteProfile?.priceNotice ?? "" };
  });
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
  const { product, priceNotice } = loaded.value;

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ShopProductConfigurator product={product} priceNotice={priceNotice} />
    </>
  );
}
