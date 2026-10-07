export const VEHICLE_TYPE_OPTIONS = [
  { label: "Магистральный тягач", value: "long-haul-tractor" },
  { label: "Региональный грузовик", value: "regional-truck" },
  { label: "Строительный самосвал", value: "construction-dumper" },
  { label: "Карьерная или специальная техника", value: "quarry-special" },
] as const;

export const OPERATING_CONDITION_OPTIONS = [
  { label: "Магистраль", value: "long-haul" },
  { label: "Региональные маршруты", value: "regional" },
  { label: "Смешанный цикл", value: "mixed" },
  { label: "Карьер и бездорожье", value: "off-road" },
] as const;

export const AXLE_OPTIONS = [
  { label: "Рулевая", value: "steer" },
  { label: "Ведущая", value: "drive" },
  { label: "Прицепная", value: "trailer" },
] as const;

export const TIRE_CATEGORIES = [
  { value: "long_haul", name: "Long Haul — магистральные", icon: "/images/application/long-haul-m.svg" },
  { value: "regional", name: "Regional — региональные", icon: "/images/application/regional-m.svg" },
  { value: "off_road", name: "Off-Road — карьерные и бездорожье", icon: "/images/application/off-road-m.svg" },
  { value: "construction", name: "Construction — строительные", icon: "/images/application/construction-m.svg" },
  { value: "urban", name: "Urban — городские", icon: "/images/application/urban-m.svg" },
] as const;

export const TIRE_ADVANTAGE_OPTIONS = [
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

export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number]["value"];
export type OperatingCondition = (typeof OPERATING_CONDITION_OPTIONS)[number]["value"];
export type CatalogAxle = (typeof AXLE_OPTIONS)[number]["value"];
export type TireCategory = (typeof TIRE_CATEGORIES)[number]["value"];
