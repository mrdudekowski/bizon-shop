"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addCartItem,
  CART_OPEN_EVENT,
  CART_UPDATED_EVENT,
  CART_STORAGE_KEY,
  clearCart,
  readCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart/cartStorage";
import type { RequestItemInput } from "@/types/requestItem";

export function useCart() {
  const [items, setItems] = useState<RequestItemInput[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    setItems(readCart());
  }, []);

  useEffect(() => {
    refresh();

    const onUpdate = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) refresh();
    };

    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onStorage);
    const onOpenRequest = () => setOpen(true);
    window.addEventListener(CART_OPEN_EVENT, onOpenRequest);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_OPEN_EVENT, onOpenRequest);
    };
  }, [refresh]);

  const addItem = useCallback((item: RequestItemInput) => {
    setItems(addCartItem(item));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems(removeCartItem(key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems(updateCartItemQuantity(key, quantity));
  }, []);

  const clear = useCallback(() => {
    setItems(clearCart());
  }, []);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    [items],
  );

  return {
    items,
    count,
    open,
    setOpen,
    addItem,
    removeItem,
    setQuantity,
    clear,
  };
}
