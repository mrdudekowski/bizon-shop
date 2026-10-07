/** Single source for catalog image fallbacks until Payload media is populated. */
export const CATALOG_IMAGE_PLACEHOLDER = "/images/placeholder.svg";

const PREMIUM_IMAGE_ROOT = "/images/premium";

export const PREMIUM_MEDIA = {
  hero: "/images/hero/backdrop.jpg",
  shopHero: `${PREMIUM_IMAGE_ROOT}/shop-hero-forged-wheel-model.png`,
  highwayCategory: `${PREMIUM_IMAGE_ROOT}/highway-fleet-portrait.png`,
  quarryCategory: `${PREMIUM_IMAGE_ROOT}/quarry-haul-truck.png`,
  forgedWheel: `${PREMIUM_IMAGE_ROOT}/forged-wheel-workshop.png`,
  consultation: `${PREMIUM_IMAGE_ROOT}/fleet-consultation.png`,
  mounting: `${PREMIUM_IMAGE_ROOT}/tire-mounting.png`,
  inspection: `${PREMIUM_IMAGE_ROOT}/tread-inspection.jpg`,
  mixedService: `${PREMIUM_IMAGE_ROOT}/mixed-service-site.png`,
  constructionDetail: `${PREMIUM_IMAGE_ROOT}/construction-drive-portrait.png`,
  severeService: `${PREMIUM_IMAGE_ROOT}/severe-service-campaign.png`,
  wetRegional: `${PREMIUM_IMAGE_ROOT}/wet-regional-route.png`,
  fleetManager: `${PREMIUM_IMAGE_ROOT}/fleet-manager.png`,
  branding: `${PREMIUM_IMAGE_ROOT}/branding-campaign.jpg`,
  brandingColorAccents: `${PREMIUM_IMAGE_ROOT}/branding-color-accents.jpg`,
  brandingLogo: `${PREMIUM_IMAGE_ROOT}/branding-logo.jpg`,
  brandingInscriptions: `${PREMIUM_IMAGE_ROOT}/branding-inscriptions.jpg`,
  brandingTirePlain: `${PREMIUM_IMAGE_ROOT}/branding-tire-plain.jpg`,
  brandingTireBranded: `${PREMIUM_IMAGE_ROOT}/branding-tire-branded.jpg`,
  regionalAllPosition: `${PREMIUM_IMAGE_ROOT}/regional-all-position-315.png`,
  regionalDrive: `${PREMIUM_IMAGE_ROOT}/regional-drive-295.png`,
  steer385: `${PREMIUM_IMAGE_ROOT}/steer-tire-385.png`,
  mixedServiceTire: `${PREMIUM_IMAGE_ROOT}/mixed-service-tire-315.png`,
  otrTire: `${PREMIUM_IMAGE_ROOT}/otr-tire-33r51.png`,
  steer295: `${PREMIUM_IMAGE_ROOT}/steer-tire-295.png`,
} as const;

const PREMIUM_FALLBACK_BY_KEY: Record<string, string> = {
  tbr: PREMIUM_MEDIA.highwayCategory,
  otr: PREMIUM_MEDIA.quarryCategory,
  dsr158: PREMIUM_MEDIA.regionalAllPosition,
  dsr177: PREMIUM_MEDIA.regionalDrive,
  dsr188: PREMIUM_MEDIA.steer295,
  forged: PREMIUM_MEDIA.forgedWheel,
  "wheel-forged": PREMIUM_MEDIA.forgedWheel,
  "bizon-forged-pro": PREMIUM_MEDIA.forgedWheel,
  "tire-pressure-fleet": PREMIUM_MEDIA.inspection,
  "otr-tread-selection": PREMIUM_MEDIA.otrTire,
  "north-logistics-fleet": PREMIUM_MEDIA.fleetManager,
  "category-accessories": PREMIUM_MEDIA.mounting,
  "category-outdoor": PREMIUM_MEDIA.severeService,
  "category-glasses": PREMIUM_MEDIA.consultation,
  "category-merch": PREMIUM_MEDIA.fleetManager,
};

export function resolveCatalogImageSrc(src?: string | null, fallbackKey?: string): string {
  return (
    src?.trim() ||
    (fallbackKey ? PREMIUM_FALLBACK_BY_KEY[fallbackKey] : undefined) ||
    CATALOG_IMAGE_PLACEHOLDER
  );
}

export function hasCatalogImage(src?: string | null, fallbackKey?: string): boolean {
  return Boolean(src?.trim() || (fallbackKey && PREMIUM_FALLBACK_BY_KEY[fallbackKey]));
}
