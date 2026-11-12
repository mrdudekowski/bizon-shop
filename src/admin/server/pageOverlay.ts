type JsonObject = Record<string, unknown>;
function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const HOME_SECTIONS = ["hero", "directions", "expertise", "branding", "shopCampaign"] as const;

function mergeShopHomeOverlay(mapped: JsonObject, overlay: JsonObject): JsonObject {
  const merged: JsonObject = { ...mapped, ...overlay };
  if (isObject(mapped.homeCarousel) && isObject(overlay.homeCarousel)) {
    merged.homeCarousel = { ...mapped.homeCarousel, ...overlay.homeCarousel };
  }
  if (!isObject(mapped.catalog) || !isObject(overlay.catalog)) return merged;

  const mappedCatalog = mapped.catalog;
  const overlayCatalog = overlay.catalog;
  const catalog: JsonObject = { ...mappedCatalog, ...overlayCatalog };
  if (isObject(mappedCatalog.copy) && isObject(overlayCatalog.copy)) {
    catalog.copy = { ...mappedCatalog.copy, ...overlayCatalog.copy };
  }
  if (Array.isArray(overlayCatalog.tiles)) {
    const persistedTiles = Array.isArray(mappedCatalog.tiles) ? mappedCatalog.tiles : [];
    const overlayTiles = overlayCatalog.tiles.length === 0 && persistedTiles.length > 0
      ? persistedTiles
      : overlayCatalog.tiles;
    catalog.tiles = overlayTiles.map((value) => {
      if (!isObject(value)) return value;
      const persisted = persistedTiles.find((tile) => isObject(tile) && String(tile.categoryId) === String(value.categoryId));
      const currentTile = isObject(persisted) ? persisted : {};
      return {
        ...currentTile,
        ...value,
        homeCarouselCaption: typeof value.homeCarouselCaption === "string"
          ? value.homeCarouselCaption
          : typeof currentTile.homeCarouselCaption === "string" ? currentTile.homeCarouselCaption : "",
      };
    });
  }
  merged.catalog = catalog;
  return merged;
}

export function mergeLegacyPageOverlay<T>(mapped: T, overlay: unknown): T {
  if (!isObject(mapped) || !isObject(overlay)) return (overlay ?? mapped) as T;
  if (mapped.id !== "home") {
    if (mapped.id === "shop-home") return mergeShopHomeOverlay(mapped, overlay) as T;
    const merged: JsonObject = { ...mapped, ...overlay };
    const currentStubDraft = Array.isArray(overlay.documents);
    if (currentStubDraft) {
      for (const key of ["featuresHeading", "features", "sections", "notice", "proof", "cta"]) {
        if (!Object.prototype.hasOwnProperty.call(overlay, key)) delete merged[key];
      }
    }
    for (const key of ["proof", "cta"]) {
      if (isObject(mapped[key]) && isObject(overlay[key])) merged[key] = { ...mapped[key], ...overlay[key] };
    }
    return merged as T;
  }
  const merged: JsonObject = { ...mapped, ...overlay };
  delete merged.selectionEntry;
  delete merged.resume;
  for (const section of HOME_SECTIONS) {
    const mappedSection = mapped[section], overlaySection = overlay[section];
    if (isObject(mappedSection) && isObject(overlaySection)) merged[section] = { ...mappedSection, ...overlaySection };
  }
  return merged as T;
}
