/** Shared catalog enums (formerly Payload field options). */

export const TIRE_APPLICATION_CATEGORIES = [
  { label: "Long Haul", value: "long_haul" },
  { label: "Regional", value: "regional" },
  { label: "Off-Road", value: "off_road" },
  { label: "Construction", value: "construction" },
  { label: "Urban", value: "urban" },
] as const;

export const WHEEL_CONSTRUCTION_METHODS = [
  { label: "Кованый", value: "forged" },
  { label: "Литой", value: "cast" },
  { label: "Flow-formed", value: "flow_formed" },
  { label: "Стальной", value: "steel" },
  { label: "Другое", value: "other" },
] as const;

export const ADMIN_GROUPS = {
  tireCatalog: "Каталог шин",
  wheelCatalog: "Каталог дисков",
  shopCatalog: "BIZON Shop",
  sitePages: "Страницы сайта",
  content: "Контент",
  sales: "Заявки",
  system: "Система",
} as const;

export const TIRE_PERFORMANCE_FEATURE_OPTIONS = [
  { label: "Управляемость", value: "handling" },
  { label: "Безопасность", value: "safety" },
  { label: "Высокий пробег", value: "high-mileage" },
  { label: "Экономичность", value: "economy" },
  { label: "Сцепление на мокрой дороге", value: "wet-grip" },
  { label: "Износостойкость", value: "anti-wear" },
  { label: "Стойкость к разрывам", value: "anti-tear" },
  { label: "Короткий тормозной путь", value: "short-braking-distance" },
  { label: "Низкий уровень шума", value: "low-noise" },
  { label: "Высокая грузоподъёмность", value: "heavy-load" },
  { label: "Самоочищение", value: "self-cleaning" },
  { label: "Восстанавливаемость", value: "retreadability" },
  { label: "Удаление камней", value: "stone-ejection" },
  { label: "Низкое сопротивление качению", value: "low-rolling-resistance" },
  { label: "Теплоотвод", value: "heat-dissipation" },
  { label: "Стойкость к порезам", value: "cut-resistance" },
  { label: "Стойкость к проколам", value: "puncture-resistance" },
] as const;
