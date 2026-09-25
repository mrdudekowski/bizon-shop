"use client";

import { requestOpenCart } from "@/lib/cart/cartStorage";
import { useCart } from "@/hooks/useCart";
import type { RequestItemInput } from "@/types/requestItem";

type AddToCartButtonProps = {
  item: RequestItemInput;
  label?: string;
  className?: string;
  openCartOnAdd?: boolean;
};

export function AddToCartButton({
  item,
  label = "В корзину",
  className = "btn-glass",
  openCartOnAdd = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  function handleClick() {
    addItem({ ...item, quantity: item.quantity ?? 1 });
    if (openCartOnAdd) requestOpenCart();
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {label}
    </button>
  );
}
