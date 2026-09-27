import { ShopProductEditor } from "@/admin/shop/ShopProductEditor";

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShopProductEditor id={id} />;
}
