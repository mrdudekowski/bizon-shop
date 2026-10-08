"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/yandexMetrika";
import {
  addCartItem,
  CART_OPEN_EVENT,
  CART_UPDATED_EVENT,
  cartStorageKey,
  clearCart,
  loadServerCart,
  migrateLegacyCart,
  readCart,
  removeCartItem,
  replaceCartFromServer,
  updateCartItemQuantity,
} from "@/lib/cart/cartStorage";
import type { CartKind } from "@/lib/cart/cartTypes";
import type { RequestItemInput } from "@/types/requestItem";

export function useCart(kind: CartKind) {
  const [items, setItems] = useState<RequestItemInput[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => setItems(readCart(kind)), [kind]);

  useEffect(() => {
    let active = true;
    void migrateLegacyCart().then(() => {
      if (!active) return;
      refresh();
      return loadServerCart(kind).then((serverItems) => {
        if (!active || !serverItems) return;
        replaceCartFromServer(kind, serverItems);
        setItems(serverItems);
      });
    }).catch(() => undefined);

    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<{ cartKind?: CartKind }>).detail?.cartKind === kind) refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === cartStorageKey(kind)) refresh();
    };
    const onOpenRequest = (event: Event) => {
      if ((event as CustomEvent<{ cartKind?: CartKind }>).detail?.cartKind !== kind) return;
      trackEvent(ANALYTICS_EVENTS.cartOpen, { cartKind: kind });
      setOpen(true);
    };
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_OPEN_EVENT, onOpenRequest);
    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_OPEN_EVENT, onOpenRequest);
    };
  }, [kind, refresh]);

  const addItem = useCallback((item: RequestItemInput) => {
    setItems(addCartItem(kind, item));
    trackEvent(ANALYTICS_EVENTS.addToCart, { cartKind: kind, itemType: String(item.itemType ?? ""), slug: String(item.slug ?? "") });
  }, [kind]);
  const removeItem = useCallback((key: string) => {
    setItems(removeCartItem(kind, key));
    trackEvent(ANALYTICS_EVENTS.removeFromCart, { cartKind: kind, key });
  }, [kind]);
  const setQuantity = useCallback((key: string, quantity: number) => setItems(updateCartItemQuantity(kind, key, quantity)), [kind]);
  const clear = useCallback(() => setItems(clearCart(kind)), [kind]);
  const count = useMemo(() => items.reduce((sum, item) => sum + (item.quantity ?? 1), 0), [items]);
  return { items, count, open, setOpen, addItem, removeItem, setQuantity, clear };
}
