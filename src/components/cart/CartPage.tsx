"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/hooks/useCart";
import { cartItemKey, isCartItemAllowed } from "@/lib/cart/cartStorage";
import type { CartKind } from "@/lib/cart/cartTypes";
import { submitRequest } from "@/lib/requests/submitRequest";
import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";
import type { RequestItemInput, SourceForm } from "@/types/requestItem";
import styles from "./CartPage.module.css";

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

type SubmitStatus = "idle" | "loading" | "success" | "error";

type CartItemsGroupProps = {
  title: string;
  items: RequestItemInput[];
  onRemove: (key: string) => void;
  onQuantityChange: (key: string, quantity: number) => void;
};

function displayName(item: RequestItemInput): string {
  const name = item.name ?? item.title ?? "Товар";
  return item.variantLabel ? `${name} — ${item.variantLabel}` : name;
}

function itemSourceLabel(item: RequestItemInput): string {
  if (item.itemType === "tire") return "BIZON Tires";
  if (item.itemType === "wheel") return "BIZON Forged";
  return "BIZON Shop";
}

function CartItemsGroup({ title, items, onRemove, onQuantityChange }: CartItemsGroupProps) {
  if (items.length === 0) return null;

  return (
    <section className={styles.group} aria-labelledby={`cart-group-${title}`}>
      <h2 id={`cart-group-${title}`} className={styles.groupTitle}>{title}</h2>
      <ul className={styles.lineList}>
        {items.map((item) => {
          const key = cartItemKey(item);
          const quantity = item.quantity ?? 1;

          return (
            <li className={styles.line} key={key}>
              <div>
                {item.url ? (
                  <Link className={styles.lineName} href={item.url}>{displayName(item)}</Link>
                ) : (
                  <span className={styles.lineName}>{displayName(item)}</span>
                )}
                <p className={styles.lineMeta}>{itemSourceLabel(item)}</p>
                {item.notes ? <p className={styles.lineNotes}>{item.notes}</p> : null}
                {item.priceOnRequest || item.price != null ? (
                  <p className={styles.linePrice}>
                    {item.priceOnRequest
                      ? "Стоимость после проверки конфигурации"
                      : displayPrice(item, quantity)}
                  </p>
                ) : null}
              </div>
              <div className={styles.lineActions}>
                <label>
                  <span className="sr-only">Количество</span>
                  <input
                    className={styles.quantity}
                    type="number"
                    min={1}
                    max={99999}
                    value={quantity}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isFinite(next)) onQuantityChange(key, next);
                    }}
                  />
                </label>
                <button className={styles.remove} type="button" onClick={() => onRemove(key)}>
                  Удалить
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type CartPageProps = {
  kind: CartKind;
  sourceForm: SourceForm;
  sourcePage: string;
  returnLinks: { href: string; label: string }[];
  successHref: string;
  successLabel: string;
};

export function CartPage({ kind, sourceForm, sourcePage, returnLinks, successHref, successLabel }: CartPageProps) {
  const cart = useCart(kind);
  const requestLabel = kind === "shop" ? "заявку BIZON Shop" : "заявку Bizon";
  const [clientType, setClientType] = useState<"individual" | "company">("individual");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const items = cart.items.filter((item) => isCartItemAllowed(kind, item));
  const tireItems = items.filter((item) => item.itemType === "tire");
  const wheelItems = items.filter((item) => item.itemType === "wheel");
  const shopItems = items.filter((item) => item.itemType === "shopProduct");

  const submittedItems = kind === "bizon" ? tireItems : [...wheelItems, ...shopItems];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittedItems.length === 0) return;

    setStatus("loading");
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get(HONEYPOT_FIELD)) {
      setStatus("idle");
      setMessage("");
      return;
    }

    const requisites = String(formData.get("requisites") ?? "").trim();
    const comment = String(formData.get("message") ?? "").trim();
    const messageWithRequisites = [
      comment,
      requisites ? `Реквизиты:\n${requisites}` : "",
    ].filter(Boolean).join("\n\n");

    try {
      await submitRequest({
        sourceForm,
        sourcePage,
        body: {
          clientType,
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          city: formData.get("city"),
          preferredContact: formData.get("preferredContact"),
          companyName: formData.get("companyName"),
          inn: formData.get("inn"),
          position: formData.get("position"),
          purchaseVolume: formData.get("purchaseVolume"),
          message: messageWithRequisites,
          items: submittedItems,
        },
      });

      setStatus("success");
      setMessage("Заявка отправлена. Менеджер свяжется с вами выбранным способом.");
      form.reset();
      cart.clear();
    } catch {
      setStatus("error");
      setMessage("Не удалось отправить заявку. Попробуйте позже.");
    }
  }

  if (items.length === 0 && status !== "success") {
    return (
      <section className="card-base info-card max-w-3xl">
        <p className="info-card-text">Корзина пуста. Добавьте товары из соответствующего каталога.</p>
        <div className={styles.emptyActions}>
          {returnLinks.map((link) => <Link key={link.href} href={link.href} className="btn-secondary inline-flex">{link.label}</Link>)}
        </div>
      </section>
    );
  }

  return (
    <div className={styles.groups}>
      {status === "success" ? (
        <section className="card-base info-card max-w-3xl">
          <h2 className="info-card-title">Спасибо</h2>
          <p className="info-card-text">{message}</p>
          <p className="mt-6"><Link href={successHref} className="btn-accent inline-flex">{successLabel}</Link></p>
        </section>
      ) : (
        <>
          {tireItems.length > 0 && <CartItemsGroup title="Шины" items={tireItems} onRemove={cart.removeItem} onQuantityChange={cart.setQuantity} />}
          {wheelItems.length > 0 && <CartItemsGroup title="Кованые диски" items={wheelItems} onRemove={cart.removeItem} onQuantityChange={cart.setQuantity} />}
          {shopItems.length > 0 && <CartItemsGroup title="Товары BIZON Shop" items={shopItems} onRemove={cart.removeItem} onQuantityChange={cart.setQuantity} />}

          <form className="card-base info-card form-card max-w-3xl" onSubmit={handleSubmit}>
            <h2 className="info-card-title">Контакты для {requestLabel}</h2>
            <p className="info-card-text">Специалист проверит совместимость, уточнит конфигурацию и только затем подтвердит стоимость.</p>
            <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            <div className={styles.checkoutGrid}>
              <label className={styles.fullWidth}>
                <span className="field-label">Тип клиента</span>
                <select className="field-input" name="clientType" value={clientType} onChange={(event) => setClientType(event.target.value === "company" ? "company" : "individual")}>
                  <option value="individual">Физическое лицо</option>
                  <option value="company">Юридическое лицо</option>
                </select>
              </label>
              <label><span className="field-label">Имя</span><input className="field-input" name="name" required autoComplete="name" /></label>
              <label><span className="field-label">Телефон</span><input className="field-input" name="phone" type="tel" required autoComplete="tel" inputMode="tel" /></label>
              <label><span className="field-label">Email — необязательно</span><input className="field-input" name="email" type="email" autoComplete="email" spellCheck={false} /></label>
              <label><span className="field-label">Город или регион</span><input className="field-input" name="city" required autoComplete="address-level2" /></label>
              <label className={styles.fullWidth}>
                <span className="field-label">Предпочтительный способ связи</span>
                <select className="field-input" name="preferredContact" defaultValue="phone">
                  <option value="phone">Телефон</option>
                  <option value="email">Email</option>
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>
              {clientType === "company" && (
                <>
                  <label><span className="field-label">Компания</span><input className="field-input" name="companyName" required autoComplete="organization" /></label>
                  <label><span className="field-label">ИНН</span><input className="field-input" name="inn" required inputMode="numeric" autoComplete="off" spellCheck={false} /></label>
                  <label><span className="field-label">Должность</span><input className="field-input" name="position" required autoComplete="organization-title" /></label>
                  <label><span className="field-label">Объём закупки</span><input className="field-input" name="purchaseVolume" required /></label>
                  <label className={styles.fullWidth}><span className="field-label">Реквизиты</span><textarea className="field-input" name="requisites" rows={3} required /></label>
                </>
              )}
              <label className={styles.fullWidth}><span className="field-label">Комментарий</span><textarea className="field-input" name="message" rows={4} /></label>
              <label className={`${styles.consent} ${styles.fullWidth}`}>
                <input type="checkbox" name="privacyConsent" required />
                <span>Я согласен на обработку персональных данных в соответствии с <Link href="/privacy-policy">политикой конфиденциальности</Link>.</span>
              </label>
            </div>
            <button className="btn-accent" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Отправка…" : `Отправить ${requestLabel}`}
            </button>
            {message && <p className={`${styles.status} ${status === "error" ? styles.statusError : ""}`} role="status" aria-live="polite">{message}</p>}
          </form>
        </>
      )}
    </div>
  );
}
