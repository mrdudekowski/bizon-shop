/** Centralized Yandex Metrika goal names (technical contract). */
export const ANALYTICS_EVENTS = {
  catalogItemOpen: "catalog_item_open",
  addToCart: "add_to_cart",
  removeFromCart: "remove_from_cart",
  cartOpen: "cart_open",
  requestSubmitSuccess: "request_submit_success",
  requestSubmitError: "request_submit_error",
  quickOrder: "quick_order",
  shopCategoryOpen: "shop_category_open",
  tireIqJobClick: "tire_iq_job_click",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventParams = Record<string, string | number | boolean>;
