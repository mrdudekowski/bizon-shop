export const VEHICLE_TYPE_OPTIONS = [
  { label: "Магистральный тягач", value: "long-haul-tractor" },
  { label: "Региональный грузовик", value: "regional-truck" },
  { label: "Строительный самосвал", value: "construction-dumper" },
  {
    label: "Карьерная или специальная техника",
    value: "quarry-special",
  },
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

export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number]["value"];
export type OperatingCondition =
  (typeof OPERATING_CONDITION_OPTIONS)[number]["value"];
export type CatalogAxle = (typeof AXLE_OPTIONS)[number]["value"];
