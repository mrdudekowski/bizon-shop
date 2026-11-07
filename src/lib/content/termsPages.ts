import { ROUTES } from "@/constants/navigation";

/** The only legal line on a request page. The longer terms live on the linked pages. */
export const REQUEST_TERMS_LINE =
  "Окончательная стоимость, фактическое наличие и срок поставки подтверждаются менеджером при обработке заявки.";

export type TermsSurface = "tires" | "shop";
export type TermsPageKey = "payment" | "delivery" | "warranty";

export type TermsPageLink = {
  key: TermsPageKey;
  label: string;
  href: string;
};

const TERMS_PAGES: Record<TermsSurface, readonly TermsPageLink[]> = {
  tires: [
    { key: "payment", label: "Оплата", href: ROUTES.payment },
    { key: "delivery", label: "Доставка", href: ROUTES.delivery },
    { key: "warranty", label: "Гарантия и возврат", href: ROUTES.warranty },
  ],
  shop: [
    { key: "payment", label: "Оплата", href: ROUTES.shopPayment },
    { key: "delivery", label: "Доставка", href: ROUTES.shopDelivery },
    { key: "warranty", label: "Гарантия и возврат", href: ROUTES.shopWarranty },
  ],
};

export function termsPages(surface: TermsSurface): readonly TermsPageLink[] {
  return TERMS_PAGES[surface];
}

export const PAYMENT_TERMS_PARAGRAPH =
  "Информация о ценах и наличии товаров на сайте носит информационный характер. Это запрос на подбор, а не покупка: цена и совместимость подтверждаются специалистом. Часть продукции может быть доступна под заказ.";

export const DELIVERY_TERMS_PARAGRAPH =
  "Срок поставки зависит от производителя, наличия продукции, объема заказа, производственного цикла и выбранной логистической схемы. Если товар отсутствует в наличии, возможность и сроки поставки под заказ уточняются индивидуально. Точные сроки, стоимость и условия поставки сообщаются после обработки заявки.";

export function termsParagraph(current: TermsPageKey): string | null {
  if (current === "payment") return PAYMENT_TERMS_PARAGRAPH;
  if (current === "delivery") return DELIVERY_TERMS_PARAGRAPH;
  return null;
}

const SURFACE_BY_PAGE_KEY: Record<string, TermsSurface> = {
  payment: "tires",
  delivery: "tires",
  warranty: "tires",
  "shop-payment": "shop",
  "shop-delivery": "shop",
  "shop-warranty": "shop",
};

export function termsContextOfPage(pageKey: string | undefined): { surface: TermsSurface; current: TermsPageKey } | null {
  if (!pageKey || !(pageKey in SURFACE_BY_PAGE_KEY)) return null;
  const current: TermsPageKey = pageKey.endsWith("warranty")
    ? "warranty"
    : pageKey.endsWith("delivery")
      ? "delivery"
      : "payment";
  return { surface: SURFACE_BY_PAGE_KEY[pageKey], current };
}
