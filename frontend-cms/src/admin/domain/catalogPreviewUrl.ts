const SITE_CATALOG_PREVIEW_PATHS: Record<string, string> = {
  tbr: "/images/premium/highway-fleet-portrait.png",
  otr: "/images/premium/quarry-haul-truck.png",
  dsr158: "/images/premium/regional-all-position-315.png",
  dsr177: "/images/premium/regional-drive-295.png",
  dsr188: "/images/premium/steer-tire-295.png",
  forged: "/images/premium/forged-wheel-workshop.png",
  "wheel-forged": "/images/premium/forged-wheel-workshop.png",
  "bizon-forged-pro": "/images/premium/forged-wheel-workshop.png",
};

const DEFAULT_SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export function resolveSiteCatalogPreview(
  slug: string,
  siteOrigin = DEFAULT_SITE_ORIGIN,
): string | null {
  const path = SITE_CATALOG_PREVIEW_PATHS[slug];
  if (!path) return null;

  try {
    return new URL(path, siteOrigin).toString();
  } catch {
    return null;
  }
}

export function resolveMediaPreviewUrl(
  mediaUrl: string | null | undefined,
  siteOrigin = DEFAULT_SITE_ORIGIN,
): string | null {
  const value = mediaUrl?.trim();
  if (!value) return null;

  try {
    const sitePath = value.replace(/^\/api\/media\/file\//, "/media/");
    return new URL(sitePath, siteOrigin).toString();
  } catch {
    return null;
  }
}
