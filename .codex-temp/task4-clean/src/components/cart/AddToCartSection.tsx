"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { RequestItemInput } from "@/types/requestItem";

type VariantOption = {
  id: string;
  label: string;
};

type AddToCartSectionProps = {
  baseItem: RequestItemInput;
  variants?: VariantOption[];
};

export function AddToCartSection({ baseItem, variants = [] }: AddToCartSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variant");

  const item = useMemo(() => {
    const selected = variants.find((variant) => variant.id === variantId);
    if (!selected) return { ...baseItem, url: baseItem.url ?? pathname ?? undefined };

    return {
      ...baseItem,
      url: baseItem.url ?? pathname ?? undefined,
      variantId: selected.id,
      variantLabel: selected.label,
    };
  }, [baseItem, pathname, variantId, variants]);

  const hint =
    variants.length > 0 && !variantId
      ? "Выберите размер в таблице выше или добавьте модель без размера."
      : item.variantLabel
        ? `Размер: ${item.variantLabel}`
        : null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <AddToCartButton item={item} />
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
