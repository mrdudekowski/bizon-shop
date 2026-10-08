"use client";

import { requestOpenCart } from "@/lib/cart/cartStorage";
import { useCart } from "@/hooks/useCart";
import type { CartKind } from "@/lib/cart/cartTypes";
import type { RequestItemInput } from "@/types/requestItem";

type AddToCartButtonProps = {
  cartKind: CartKind;
  item: RequestItemInput;
  label?: string;
  className?: string;
  openCartOnAdd?: boolean;
};

export function AddToCartButton({
  cartKind,
  item,
  label = "В корзину",
  className = "btn-secondary",
  openCartOnAdd = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart(cartKind);

  function handleClick() {
    addItem({ ...item, quantity: item.quantity ?? 1 });
    if (openCartOnAdd) requestOpenCart(cartKind);
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {label}
    </button>
  );
}
