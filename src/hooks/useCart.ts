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
  getCartMutationVersion,
  loadServerCart,
  migrateLegacyCart,
  noteCartMutation,
  isCartItemAllowed,
  readCart,
  removeCartItem,
  replaceCartFromServer,
  updateCartItemQuantity,
} from "@/lib/cart/cartStorage";
import type { CartKind } from "@/lib/cart/cartTypes";
import type { RequestItemInput } from "@/types/requestItem";

export function trackCartAddIfAllowed(kind: CartKind, item: RequestItemInput): boolean {
  if (!isCartItemAllowed(kind, item)) return false;
  trackEvent(ANALYTICS_EVENTS.addToCart, { cartKind: kind, itemType: String(item.itemType ?? ""), slug: String(item.slug ?? "") });
  return true;
}

export function useCart(kind: CartKind) {
  const [cartState, setCartState] = useState(() => ({ kind, items: [] as RequestItemInput[] }));
  const items = cartState.kind === kind ? cartState.items : readCart(kind);
  const setItems = useCallback((next: RequestItemInput[]) => setCartState({ kind, items: next }), [kind]);
  const [openState, setOpenState] = useState({ kind, open: false });
  const open = openState.kind === kind && openState.open;
  const setOpen = useCallback((next: boolean | ((previous: boolean) => boolean)) => {
    setOpenState((previous) => ({
      kind,
      open: typeof next === "function" ? next(previous.kind === kind && previous.open) : next,
    }));
  }, [kind]);

  const refresh = useCallback(() => setItems(readCart(kind)), [kind]);

  useEffect(() => {
    let active = true;
    void migrateLegacyCart().then(() => {
      if (!active) return;
      refresh();
      const mutationVersion = getCartMutationVersion(kind);
      return loadServerCart(kind).then((serverItems) => {
        if (!active || !serverItems) return;
        if (getCartMutationVersion(kind) !== mutationVersion) {
          refresh();
          return;
        }
        replaceCartFromServer(kind, serverItems);
        setItems(readCart(kind));
      });
    }).catch(() => undefined);

    const onUpdate = (event: Event) => {
      if ((event as CustomEvent<{ cartKind?: CartKind }>).detail?.cartKind === kind) refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === cartStorageKey(kind)) {
        noteCartMutation(kind);
        refresh();
      }
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
    trackCartAddIfAllowed(kind, item);
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
