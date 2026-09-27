import { ShopCategoryEditor } from "@/admin/shop/ShopCategoryEditor";

export default async function ShopCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShopCategoryEditor id={id} />;
}
