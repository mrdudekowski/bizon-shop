"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { HONEYPOT_FIELD } from "@/lib/requests/validateRequest";
import { submitRequest } from "@/lib/requests/submitRequest";
import type { RequestItemInput } from "@/types/requestItem";

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get(HONEYPOT_FIELD)) {
      setStatus("success");
      setMessage("Заявка отправлена.");
      return;
    }

    try {
      await submitRequest({
        sourceForm: "contact",
        sourcePage: pathname || "/contact",
        body: {
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          message: formData.get("message"),
        },
      });

      setStatus("success");
      setMessage("Заявка отправлена. Мы свяжемся с вами в ближайшее время.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Не удалось отправить заявку. Попробуйте позже или позвоните нам.");
    }
  }

  return (
    <form className="card-base info-card form-card max-w-xl" onSubmit={handleSubmit}>
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div>
        <label htmlFor="name" className="field-label">
          Имя
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="phone" className="field-label">
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="message" className="field-label">
          Сообщение
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="field-input"
        />
      </div>
      <button type="submit" className="btn-accent" disabled={status === "loading"}>
        {status === "loading" ? "Отправка…" : "Отправить"}
      </button>
      {message && (
        <p className={`info-card-text ${status === "error" ? "text-destructive" : ""}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}

type QuickOrderFormProps = {
  item: RequestItemInput;
  heading?: string;
  sourcePage?: string;
};

export function QuickOrderForm({ item, heading, sourcePage }: QuickOrderFormProps) {
  const pathname = usePathname();
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const displayName = item.name ?? item.title ?? "товар";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get(HONEYPOT_FIELD)) {
      setStatus("success");
      setMessage("Заявка отправлена.");
      return;
    }

    const quantity = Number(formData.get("quantity") ?? item.quantity ?? 1);

    try {
      await submitRequest({
        sourceForm: "product_quick_order",
        sourcePage: sourcePage ?? pathname ?? item.url ?? undefined,
        body: {
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          message: formData.get("message"),
          items: [
            {
              ...item,
              quantity: Number.isFinite(quantity) && quantity > 0
                ? Math.min(99999, Math.max(1, Math.round(quantity)))
                : 1,
            },
          ],
        },
      });

      setStatus("success");
      setMessage("Заявка отправлена. Менеджер свяжется с вами по телефону.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Не удалось отправить заявку. Попробуйте позже.");
    }
  }

  return (
    <form className="card-base info-card form-card max-w-xl" onSubmit={handleSubmit}>
      <h3 className="info-card-title">{heading ?? `Быстрый заказ — ${displayName}`}</h3>
      {item.variantLabel && (
        <p className="text-sm text-muted">Размер / комплектация: {item.variantLabel}</p>
      )}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div>
        <label htmlFor="quick-name" className="field-label">
          Имя
        </label>
        <input
          id="quick-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="quick-phone" className="field-label">
          Телефон
        </label>
        <input
          id="quick-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="quick-quantity" className="field-label">
          Количество
        </label>
        <input
          id="quick-quantity"
          name="quantity"
          type="number"
          min={1}
          max={99999}
          step={1}
          defaultValue={item.quantity ?? 1}
          inputMode="numeric"
          className="field-input"
        />
      </div>
      <div>
        <label htmlFor="quick-message" className="field-label">
          Комментарий
        </label>
        <textarea
          id="quick-message"
          name="message"
          rows={3}
          className="field-input"
        />
      </div>
      <button type="submit" className="btn-accent" disabled={status === "loading"}>
        {status === "loading" ? "Отправка…" : "Отправить заявку"}
      </button>
      {message && (
        <p className={`info-card-text ${status === "error" ? "text-destructive" : ""}`} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}

/** @deprecated Use QuickOrderForm with typed RequestItemInput */
type ProductQuickOrderFormProps = {
  productSlug: string;
  productName: string;
  productUrl: string;
  productId?: string;
};

export function ProductQuickOrderForm({
  productSlug,
  productName,
  productUrl,
  productId,
}: ProductQuickOrderFormProps) {
  return (
    <QuickOrderForm
      item={{
        itemType: "shopProduct",
        itemId: productId,
        name: productName,
        slug: productSlug,
        url: productUrl,
        quantity: 1,
        priceOnRequest: true,
      }}
      heading={`Быстрый заказ — ${productName}`}
      sourcePage={productUrl}
    />
  );
}
