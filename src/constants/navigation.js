/**
 * Canonical public routes — single source of truth for navigation.
 */
export const ROUTES = {
  home: "/",
  models: "/models",
  shop: "/shop",
  tireIq: "/tire-iq",
  contact: "/contact",
  warranty: "/warranty",
  about: "/about",
  supplier: "/become-a-supplier",
  branding: "/branding",
  privacyPolicy: "/privacy-policy",
  cart: "/cart",
  shopCart: "/shop/cart",
  shopCategories: "/shop/categories",
  shopDeliveryAndReturns: "/shop/delivery-and-returns",
};

/** Primary header navigation */
export const HEADER_NAV = [
  { label: "Модели", href: ROUTES.models },
  { label: "Магазин", href: ROUTES.shop },
  { label: "Контакты", href: ROUTES.contact },
];

/** Static routes always in sitemap (listing hubs with Payload-backed children). */
export const SITEMAP_STATIC_ROUTES = [
  ROUTES.home,
  ROUTES.models,
  ROUTES.shop,
  ROUTES.contact,
  ROUTES.warranty,
  ROUTES.about,
  ROUTES.supplier,
  ROUTES.branding,
  ROUTES.privacyPolicy,
  ROUTES.cart,
  ROUTES.shopCart,
  ROUTES.shopCategories,
  ROUTES.shopDeliveryAndReturns,
];

/** Content list routes — add to sitemap only when published items exist. */
export const SITEMAP_CONTENT_LIST_ROUTES = {
  tireIq: ROUTES.tireIq,
};
