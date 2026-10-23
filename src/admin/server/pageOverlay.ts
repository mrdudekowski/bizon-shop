type JsonObject = Record<string, unknown>;
function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const HOME_SECTIONS = ["hero", "directions", "expertise", "branding", "shopCampaign"] as const;
export function mergeLegacyPageOverlay<T>(mapped: T, overlay: unknown): T {
  if (!isObject(mapped) || !isObject(overlay)) return (overlay ?? mapped) as T;
  if (mapped.id !== "home") {
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
