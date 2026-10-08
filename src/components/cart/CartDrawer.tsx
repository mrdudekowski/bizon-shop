"use client";

import Link from "next/link";
import { useEffect } from "react";

import { cartItemKey } from "@/lib/cart/cartStorage";
import type { CartKind } from "@/lib/cart/cartTypes";
import { ROUTES } from "@/constants/navigation";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { RequestItemInput } from "@/types/requestItem";
import styles from "./CartDrawer.module.css";

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function displayPrice(item: RequestItemInput, quantity: number): string | null {
  if (item.priceOnRequest || item.price == null) return null;
  const unitPrice = currencyFormatter.format(item.price);
  return quantity > 1
    ? `${unitPrice} за шт. · ${currencyFormatter.format(item.price * quantity)}`
    : unitPrice;
}

type CartDrawerProps = {
  cartKind: CartKind;
  open: boolean;
  items: RequestItemInput[];
  onClose: () => void;
  onRemove: (key: string) => void;
  onQuantityChange: (key: string, quantity: number) => void;
  onClear: () => void;
};

function displayName(item: RequestItemInput): string {
  const name = item.name ?? item.title ?? "Товар";
  return item.variantLabel ? `${name} — ${item.variantLabel}` : name;
}

export function CartDrawer({
  cartKind,
  open,
  items,
  onClose,
  onRemove,
  onQuantityChange,
}: CartDrawerProps) {
  const drawerRef = useFocusTrap(open);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`${styles.overlay} ${open ? styles.open : ""}`}
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <div className={styles.backdrop} onClick={onClose} role="presentation" />

      <aside
        ref={drawerRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className={styles.header}>
          <h2 id="cart-drawer-title" className={styles.title}>
            Корзина
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.context}>{cartKind === "shop" ? "Заявка BIZON Shop" : "Заявка BIZON Tires"}</p>
          {items.length === 0 ? (
            <p className={styles.empty}>{cartKind === "shop"
              ? "Корзина пуста. Добавьте диски или товары BIZON Shop."
              : "Корзина пуста. Добавьте шины."}</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => {
                const key = cartItemKey(item);
                const quantity = item.quantity ?? 1;

                return (
                  <li key={key} className={styles.line}>
                    <div className={styles.lineMain}>
                      {item.url ? (
                        <Link href={item.url} className={styles.lineName} onClick={onClose}>
                          {displayName(item)}
                        </Link>
                      ) : (
                        <span className={styles.lineName}>{displayName(item)}</span>
                      )}
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => onRemove(key)}
                        aria-label={`Удалить ${displayName(item)}`}
                      >
                        Удалить
                      </button>
                    </div>
                    {item.notes ? <p className={styles.lineNotes}>{item.notes}</p> : null}
                    {item.priceOnRequest || item.price != null ? (
                      <p className={styles.linePrice}>
                        {item.priceOnRequest
                          ? "Расчёт после проверки"
                          : displayPrice(item, quantity)}
                      </p>
                    ) : null}
                    <label className={styles.quantityLabel}>
                      Кол-во
                      <input
                        type="number"
                        name={`quantity-${key}`}
                        min={1}
                        max={99999}
                        value={quantity}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next)) onQuantityChange(key, next);
                        }}
                        className={styles.quantityInput}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 0 && (
            <p className="mt-6">
              <Link href={cartKind === "shop" ? ROUTES.shopCart : ROUTES.cart} className="btn-secondary inline-flex" onClick={onClose}>
                Перейти к заявке
              </Link>
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
