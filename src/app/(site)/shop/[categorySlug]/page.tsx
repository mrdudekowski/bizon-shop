import { notFound } from "next/navigation";
import { getAllShopCategorySlugs, getShopProducts, getShopCategoryBySlug, getShopCategories } from "@/lib/content";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ShopLifestyleCategoryPage } from "@/components/shop/ShopLifestyleCategory";
import { ShopProductCatalog } from "@/components/shop/ShopProductCatalog";
import { PublishedContentUnavailable } from "@/components/content/PublishedContentUnavailable";
import { loadPublished } from "@/lib/content/loadPublished";
import {
  getShopLifestyleCategory,
  SHOP_LIFESTYLE_CATEGORIES,
} from "@/constants/shopCategories";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateStaticParams() {
  const loaded = await loadPublished(getAllShopCategorySlugs);
  const slugs = loaded.kind === "ok" ? loaded.value : [];
  return Array.from(new Set([
    ...SHOP_LIFESTYLE_CATEGORIES.map((category) => category.slug),
    ...slugs,
  ])).map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { categorySlug } = await params;
  const loaded = await loadPublished(() => getShopCategoryBySlug(categorySlug));
  const category = loaded.kind === "ok" ? loaded.value : null;
  if (category) {
    return createPageMetadata({
      title: category.name,
      description: category.description,
      path: `/shop/${category.slug}`,
    });
  }

  const lifestyleCategory = getShopLifestyleCategory(categorySlug);
  if (!lifestyleCategory) return {};
  return createPageMetadata({
    title: lifestyleCategory.title,
    description: lifestyleCategory.description,
    path: `/shop/${lifestyleCategory.slug}`,
  });
}

export default async function ShopCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const lifestyleCategory = getShopLifestyleCategory(categorySlug);

  if (lifestyleCategory) {
    const loaded = await loadPublished(async () => {
      const [products, published, cms] = await Promise.all([
        getShopProducts({ categorySlug }),
        getShopCategories(),
        getShopCategoryBySlug(categorySlug),
      ]);
      return { products, published, cms };
    });
    if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;
    const { products, published, cms } = loaded.value;
    const siblingLifestyle = SHOP_LIFESTYLE_CATEGORIES.find((item) => item.slug !== lifestyleCategory.slug);
    const siblingCms = siblingLifestyle
      ? published.find((item) => item.slug === siblingLifestyle.slug)
      : undefined;

    return (
      <ShopLifestyleCategoryPage
        category={lifestyleCategory}
        heading={cms?.name || lifestyleCategory.title}
        lead={cms?.description?.trim() || lifestyleCategory.description}
        products={products}
        sibling={
          siblingLifestyle
            ? {
                slug: siblingLifestyle.slug,
                name: siblingCms?.name || siblingLifestyle.title,
                desktopImage: siblingLifestyle.desktopImage,
                mobileImage: siblingLifestyle.mobileImage,
              }
            : undefined
        }
      />
    );
  }

  const loaded = await loadPublished(async () => {
    const category = await getShopCategoryBySlug(categorySlug);
    if (!category) return null;
    const products = await getShopProducts({ categorySlug });
    return { category, products };
  });
  if (loaded.kind === "unavailable") return <PublishedContentUnavailable />;

  if (!loaded.value) {
    notFound();
  }
  return <ShopProductCatalog category={loaded.value.category} products={loaded.value.products} />;
}
