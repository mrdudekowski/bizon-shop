import { CartPage } from "@/components/cart/CartPage";
import { PageHeader } from "@/components/catalog/PageHeader";
import { ROUTES } from "@/constants/navigation";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Заявка BIZON Shop",
  description: "Оставьте заявку на товары BIZON Shop.",
  path: ROUTES.shopCart,
});

export default function ShopCartRoutePage() {
  return (
    <div className="section-inner">
      <PageHeader
        title="Заявка BIZON Shop"
        description="Проверьте выбранные товары и оставьте контакты для заявки."
        breadcrumbs={[{ href: ROUTES.shop, label: "BIZON Shop" }, { href: ROUTES.shopCart, label: "Заявка" }]}
      />
      <CartPage
        kind="shop"
        sourceForm="cart"
        sourcePage={ROUTES.shopCart}
        returnLinks={[
          { href: "/shop/wheels/forged", label: "Кованые диски" },
          { href: ROUTES.shop, label: "Каталог BIZON Shop" },
        ]}
        successHref={ROUTES.shop}
        successLabel="Вернуться в BIZON Shop"
      />
    </div>
  );
}
