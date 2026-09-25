"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cartItemKey } from "@/lib/cart/cartStorage";
import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";
import { submitRequest } from "@/lib/requests/submitRequest";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { RequestItemInput } from "@/types/requestItem";
import styles from "./CartDrawer.module.css";

type CartDrawerProps = {
  open: boolean;
  items: RequestItemInput[];
  onClose: () => void;
  onRemove: (key: string) => void;
  onQuantityChange: (key: string, quantity: number) => void;
  onClear: () => void;
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

function displayName(item: RequestItemInput): string {
  const name = item.name ?? item.title ?? "Товар";
  return item.variantLabel ? `${name} — ${item.variantLabel}` : name;
}

export function CartDrawer({
  open,
  items,
  onClose,
  onRemove,
  onQuantityChange,
  onClear,
}: CartDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useFocusTrap(open);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;

    setStatus("loading");
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get(HONEYPOT_FIELD)) {
      setStatus("success");
      setMessage("Заявка отправлена.");
      onClear();
      return;
    }

    try {
      await submitRequest({
        sourceForm: "cart",
        sourcePage: pathname || "/",
        body: {
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          message: formData.get("message"),
          items,
        },
      });

      setStatus("success");
      setMessage("Заявка отправлена. Менеджер свяжется с вами по телефону.");
      form.reset();
      onClear();
    } catch {
      setStatus("error");
      setMessage("Не удалось отправить заявку. Попробуйте позже.");
    }
  }

  return (
    <div
      className={`${styles.overlay} ${open ? styles.open : ""}`}
      aria-hidden={!open}
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
          {items.length === 0 ? (
            <p className={styles.empty}>Корзина пуста. Добавьте товары из каталога.</p>
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
                    <label className={styles.quantityLabel}>
                      Кол-во
                      <input
                        type="number"
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
            <form className={styles.form} onSubmit={handleSubmit}>
              <p className={styles.formHint}>Оставьте контакты — менеджер подготовит предложение.</p>
              <input
                type="text"
                name={HONEYPOT_FIELD}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className={styles.honeypot}
              />
              <div>
                <label htmlFor="cart-name" className={styles.fieldLabel}>
                  Имя
                </label>
                <input
                  id="cart-name"
                  name="name"
                  type="text"
                  required
                  className={styles.fieldInput}
                />
              </div>
              <div>
                <label htmlFor="cart-phone" className={styles.fieldLabel}>
                  Телефон
                </label>
                <input
                  id="cart-phone"
                  name="phone"
                  type="tel"
                  required
                  className={styles.fieldInput}
                />
              </div>
              <div>
                <label htmlFor="cart-email" className={styles.fieldLabel}>
                  Email
                </label>
                <input id="cart-email" name="email" type="email" className={styles.fieldInput} />
              </div>
              <div>
                <label htmlFor="cart-message" className={styles.fieldLabel}>
                  Комментарий
                </label>
                <textarea
                  id="cart-message"
                  name="message"
                  rows={3}
                  className={styles.fieldInput}
                />
              </div>
              <button type="submit" className="btn-accent" disabled={status === "loading"}>
                {status === "loading" ? "Отправка…" : "Отправить заявку"}
              </button>
              {message && (
                <p
                  className={`${styles.status} ${status === "error" ? styles.statusError : ""}`}
                  role="status"
                >
                  {message}
                </p>
              )}
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
