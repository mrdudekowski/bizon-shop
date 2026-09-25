export const VERIFICATION_STATUSES = [
  "imported",
  "needsReview",
  "verified",
  "rejected",
] as const;

export const AVAILABILITY_STATUSES = [
  "available",
  "on_request",
  "unavailable",
] as const;

export const SIZE_FORMATS = ["metric", "imperial"] as const;
export const CONSTRUCTION_CODES = ["R", "D", "B"] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
export type SizeFormat = (typeof SIZE_FORMATS)[number];
export type ConstructionCode = (typeof CONSTRUCTION_CODES)[number];

export function normalizeCatalogIdentity(value: string): string {
  const normalized = value.trim().toLocaleUpperCase("en-US");
  if (!normalized) {
    throw new Error("Catalog identity is required");
  }
  return normalized;
}

export function tireVariantCompositeKey(
  modelId: string | number,
  sizeNormalized: string,
  plyRatingPr: number,
): string {
  const normalizedModelId = String(modelId).trim();
  const normalizedSize = sizeNormalized.trim().toLocaleUpperCase("en-US");
  if (
    !normalizedModelId ||
    !normalizedSize ||
    !Number.isInteger(plyRatingPr) ||
    plyRatingPr <= 0
  ) {
    throw new Error("Variant composite key requires model, size and PR");
  }
  return `${normalizedModelId}|${normalizedSize}|${plyRatingPr}`;
}

export function toCommercialState(input: {
  price?: number | null;
  availabilityStatus?: AvailabilityStatus | null;
}): { price: number | null; availabilityStatus: AvailabilityStatus } {
  return {
    price: input.price ?? null,
    availabilityStatus: input.availabilityStatus ?? "on_request",
  };
}
