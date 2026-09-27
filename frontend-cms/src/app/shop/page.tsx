import { Suspense } from "react";
import { ShopProductList } from "@/admin/shop/ShopProductList";

export default function ShopPage() {
  return <Suspense fallback={<main><h1>Shop</h1><p>Загружаем каталог…</p></main>}><ShopProductList /></Suspense>;
}
