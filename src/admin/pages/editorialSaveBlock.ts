const EDITORIAL_PAGE_IDS = new Set([
  "about",
  "warranty",
  "branding",
  "become-a-supplier",
  "delivery-geography",
  "privacy-policy",
  "shop-delivery-returns",
]);

export function editorialSaveBlockReason(
  pageId: string,
  draft: { features?: { title: string }[]; sections?: { heading: string }[] },
): string | null {
  if (!EDITORIAL_PAGE_IDS.has(pageId)) return null;
  const untitledPoint = (draft.features ?? []).some((item) => item.title.trim() === "");
  const untitledSection = (draft.sections ?? []).some((item) => item.heading.trim() === "");
  if (!untitledPoint && !untitledSection) return null;
  return "Укажите заголовок или удалите блок без названия";
}
