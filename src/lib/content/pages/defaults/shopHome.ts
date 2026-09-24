import {
  SHOP_CATEGORY_SLIDES,
  SHOP_HOME_WHEEL_SLUGS,
  SHOP_ORDER_STEPS,
  SHOP_VEHICLE_STORIES,
} from "@/constants/shopHome";

import type { ShopHomePageContent } from "../types";

export const SHOP_HOME_PAGE_DEFAULTS: ShopHomePageContent = {
  key: "shop-home",
  hero: {
    eyebrow: "BIZON Forged",
    title: "Кованые диски для вашего автомобиля",
    lead: "Выберите дизайн — параметры и совместимость проверит специалист BIZON.",
    imageUrl: "/images/premium/shop-hero-forged-wheel-model.png",
    imageAlt: "Кованый диск BIZON и модель в красном образе",
    cta: { label: "Выбрать модель и проверить совместимость", href: "#wheels" },
  },
  wheelsIntro: {
    kicker: "BIZON Forged",
    eyebrow: "",
    title: "Выберите свой дизайн",
    lead: "Кованые диски BIZON изготавливаются под заказ. Выберите модель — специалист проверит совместимость с вашим автомобилем.",
  },
  orderSteps: SHOP_ORDER_STEPS.map((step) => ({
    title: step.title,
    description: step.description,
  })),
  categoryCarousel: SHOP_CATEGORY_SLIDES.map((slide) => ({ ...slide })),
  vehicles: {
    eyebrow: "BIZON Forged",
    title: "Созданы менять характер",
    lead: "Один автомобиль — разные ощущения. Дизайн BIZON подчёркивает стиль от городского premium до экспедиционного off-road.",
    cta: { label: "Выбрать модель и проверить совместимость", href: "#wheels" },
    slides: SHOP_VEHICLE_STORIES.map((story) => ({
      title: story.title,
      image: story.image,
      alt: story.alt,
    })),
  },
  preferredWheelSlugs: SHOP_HOME_WHEEL_SLUGS,
};
