import {
  AXLE_OPTIONS,
  OPERATING_CONDITION_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type CatalogAxle,
  type OperatingCondition,
  type VehicleType,
} from "../lib/selection/options";

export type NormalizedSelectionContext = {
  vehicle?: VehicleType;
  conditions: OperatingCondition[];
  axle?: CatalogAxle | "unknown";
  size?: string;
  modelSlugs: string[];
};

const VEHICLES = new Set<string>(VEHICLE_TYPE_OPTIONS.map((item) => item.value));
const CONDITIONS = new Set<string>(OPERATING_CONDITION_OPTIONS.map((item) => item.value));
const AXLES = new Set<string>([...AXLE_OPTIONS.map((item) => item.value), "unknown"]);
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSelectionContext(raw: unknown): NormalizedSelectionContext {
  const normalized: NormalizedSelectionContext = { conditions: [], modelSlugs: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return normalized;
  const source = raw as Record<string, unknown>;

  if (typeof source.vehicle === "string" && VEHICLES.has(source.vehicle)) {
    normalized.vehicle = source.vehicle as VehicleType;
  }
  if (Array.isArray(source.conditions)) {
    normalized.conditions = Array.from(
      new Set(
        source.conditions.filter(
          (value): value is OperatingCondition =>
            typeof value === "string" && CONDITIONS.has(value),
        ),
      ),
    );
  }
  if (typeof source.axle === "string" && AXLES.has(source.axle)) {
    normalized.axle = source.axle as CatalogAxle | "unknown";
  }
  if (typeof source.size === "string" && source.size.trim()) {
    normalized.size = source.size.trim().slice(0, 64);
  }
  if (Array.isArray(source.modelSlugs)) {
    normalized.modelSlugs = Array.from(
      new Set(
        source.modelSlugs.filter(
          (value): value is string =>
            typeof value === "string" &&
            value.length <= 120 &&
            SAFE_SLUG.test(value),
        ),
      ),
    ).slice(0, 3);
  }
  return normalized;
}
