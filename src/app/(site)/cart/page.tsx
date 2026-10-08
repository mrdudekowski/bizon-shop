import { CartPage } from "@/components/cart/CartPage";
import { PageHeader } from "@/components/catalog/PageHeader";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Заявка Bizon",
  description: "Оставьте заявку на шины BIZON.",
  path: "/cart",
});

export default function CartRoutePage() {
  return (
    <div className="section-inner">
      <PageHeader
        title="Заявка Bizon"
        description="Проверьте выбранные шины и оставьте контакты для заявки."
        breadcrumbs={[{ href: "/", label: "Главная" }, { href: "/cart", label: "Заявка" }]}
      />
      <CartPage
        kind="bizon"
        sourceForm="cart"
        sourcePage="/cart"
        returnLinks={[{ href: "/models", label: "Шины BIZON" }]}
        successHref="/models"
        successLabel="Вернуться к шинам"
      />
    </div>
  );
}
