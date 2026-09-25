/**
 * Canonical public routes — single source of truth for navigation.
 */
export const ROUTES = {
  home: "/",
  models: "/models",
  shop: "/shop",
  tireIq: "/tire-iq",
  peopleStories: "/people-stories",
  contact: "/contact",
  warranty: "/warranty",
  about: "/about",
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
];

/** Content list routes — add to sitemap only when published items exist. */
export const SITEMAP_CONTENT_LIST_ROUTES = {
  tireIq: ROUTES.tireIq,
  peopleStories: ROUTES.peopleStories,
};
