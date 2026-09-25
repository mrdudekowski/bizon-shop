import type { NormalizedRequestItem } from "./types";

const ITEM_TYPE_LABELS: Record<NormalizedRequestItem["itemType"], string> = {
  tire: "Шина",
  wheel: "Диск",
  shopProduct: "Товар магазина",
};

export function formatRequestItems(items: NormalizedRequestItem[]): string | null {
  if (!items.length) return null;

  const lines = items.map((item, index) => {
    const parts = [
      `[${ITEM_TYPE_LABELS[item.itemType]}] ${item.itemName}`,
      item.variantLabel ? item.variantLabel : undefined,
      item.quantity > 1 ? `× ${item.quantity}` : undefined,
      item.parentSlug ? `(${item.parentSlug})` : undefined,
      item.url,
    ].filter(Boolean);

    return `${index + 1}. ${parts.join(" · ")}`;
  });

  return `Позиции:\n${lines.join("\n")}`;
}
