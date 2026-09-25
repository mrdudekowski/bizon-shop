"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { QuickOrderForm } from "@/components/forms/ContactForm";
import type { RequestItemInput } from "@/types/requestItem";

type VariantOption = {
  id: string;
  label: string;
};

type QuickOrderSectionProps = {
  baseItem: RequestItemInput;
  variants?: VariantOption[];
  heading?: string;
};

export function QuickOrderSection({ baseItem, variants = [], heading }: QuickOrderSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variant");

  const item = useMemo(() => {
    const selected = variants.find((variant) => variant.id === variantId);
    if (!selected) return baseItem;

    return {
      ...baseItem,
      variantId: selected.id,
      variantLabel: selected.label,
    };
  }, [baseItem, variantId, variants]);

  const title =
    heading ??
    (item.variantLabel
      ? `${baseItem.name} — ${item.variantLabel}`
      : (baseItem.name ?? "Быстрый заказ"));

  return (
    <div id="quick-order" className="mt-8 max-w-3xl scroll-mt-24">
      <QuickOrderForm item={item} heading={title} sourcePage={pathname || baseItem.url || undefined} />
    </div>
  );
}
