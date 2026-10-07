"use client";

import { Suspense, useState } from "react";
import { ShopProductList } from "@/admin/shop/ShopProductList";
import { ShopShowcaseEditor } from "@/admin/shop/ShopShowcaseEditor";

export default function ShopPage() {
  const [tab, setTab] = useState<"categories" | "showcase">("categories");
  return <div>
    <nav className="blockNav" role="tablist" aria-label="Разделы Shop">
      <button type="button" role="tab" aria-selected={tab === "categories"} onClick={() => setTab("categories")}>Категории и товары</button>
      <button type="button" role="tab" aria-selected={tab === "showcase"} onClick={() => setTab("showcase")}>Оформление Shop</button>
    </nav>
    <Suspense fallback={<main><h1>Shop</h1><p>Загружаем каталог…</p></main>}>
      {tab === "categories" ? <ShopProductList /> : <ShopShowcaseEditor />}
    </Suspense>
  </div>;
}
