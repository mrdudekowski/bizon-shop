"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { requestOpenCart } from "@/lib/cart/cartStorage";
import { useCart } from "@/hooks/useCart";
import type { RequestItemInput } from "@/types/requestItem";
import styles from "./WheelOrderPanel.module.css";

type WheelOrderVariant = {
  id: string;
  label: string;
  price?: number;
  priceOnRequest?: boolean;
};

type WheelOrderPanelProps = {
  baseItem: RequestItemInput;
  variants: WheelOrderVariant[];
  finish?: string;
};

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function configurationKey(values: string[]): string {
  const normalized = values
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  return normalized || "standard";
}

function formatPrice(variant: WheelOrderVariant | null): string {
  if (!variant || variant.priceOnRequest || variant.price == null) return "По запросу";
  return `${variant.price.toLocaleString("ru-RU")} ₽`;
}

export function WheelOrderPanel({ baseItem, variants, finish = "" }: WheelOrderPanelProps) {
  const cart = useCart("shop");
  const [variantId, setVariantId] = useState(variants.length === 1 ? variants[0].id : "");
  const maxQuantity = baseItem.parentSlug === "forged" ? 8 : 999;
  const [quantity, setQuantity] = useState(baseItem.parentSlug === "forged" ? 4 : 1);
  const selected = variants.find((variant) => variant.id === variantId) ?? null;
  const needsVariant = variants.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsVariant && !selected) return;

    const formData = new FormData(event.currentTarget);
    const vehicle = value(formData, "vehicle");
    const year = value(formData, "year");
    const currentSize = value(formData, "currentSize");
    const desiredSize = value(formData, "desiredSize");
    const selectedFinish = value(formData, "finish");
    const vehicleLabel = [vehicle, year].filter(Boolean).join(" ");
    const notes = [
      vehicleLabel ? `Автомобиль: ${vehicleLabel}` : "",
      currentSize ? `Текущий размер: ${currentSize}` : "",
      desiredSize ? `Желаемый размер: ${desiredSize}` : "",
      selectedFinish ? `Исполнение: ${selectedFinish}` : "",
    ].filter(Boolean).join("; ");
    const variantLabel = [selected?.label, vehicleLabel].filter(Boolean).join(" · ");
    const fitmentValues = [vehicle, year, currentSize, desiredSize, selectedFinish];
    const configuration = fitmentValues.some(Boolean)
      ? configurationKey([selected?.id ?? "без-размера", ...fitmentValues])
      : selected?.id;

    cart.addItem({
      ...baseItem,
      variantId: configuration,
      variantLabel: variantLabel || undefined,
      quantity,
      price: selected?.price,
      priceOnRequest: selected == null || selected.priceOnRequest || selected.price == null,
      notes: notes || undefined,
    });
    requestOpenCart("shop");
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit} aria-labelledby="wheel-order-heading">
      <div className={styles.heading}>
        <h2 id="wheel-order-heading">Заявка на подбор</h2>
        <p>Специалист проверит совместимость и уточнит стоимость.</p>
      </div>

      {variants.length > 0 ? (
        <label className={styles.field}>
          <span className={styles.label}>Размер и параметры</span>
          <select
            className={styles.control}
            value={variantId}
            onChange={(event) => setVariantId(event.target.value)}
            required
          >
            <option value="">Выберите размер</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={styles.hint}>Размеры уточняются — специалист поможет подобрать конфигурацию.</p>
      )}

      <div className={styles.orderMeta}>
        <div className={styles.priceBlock}>
          <span className={styles.label}>Стоимость</span>
          <strong>{formatPrice(selected)}</strong>
        </div>
        <label className={styles.quantityField}>
          <span className={styles.label}>Количество дисков</span>
          <input
            className={styles.control}
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) {
                setQuantity(Math.min(maxQuantity, Math.max(1, Math.round(next))));
              }
            }}
          />
        </label>
      </div>

      <details className={styles.vehicleDetails}>
        <summary>Указать автомобиль для точного подбора</summary>
        <p>Необязательно. Эти сведения помогут специалисту проверить совместимость.</p>
        <div className={styles.vehicleFields}>
          <label className={styles.field}>
            <span className={styles.label}>Марка и модель автомобиля</span>
            <input
              className={styles.control}
              name="vehicle"
              maxLength={120}
              placeholder="Например, КАМАЗ 5490"
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Год выпуска</span>
            <input
              className={styles.control}
              name="year"
              type="number"
              min={1950}
              max={new Date().getFullYear() + 1}
              inputMode="numeric"
              placeholder="2024"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Текущий размер колёс</span>
            <input
              className={styles.control}
              name="currentSize"
              maxLength={50}
              placeholder="Например, 265/65 R17"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Желаемый размер</span>
            <input
              className={styles.control}
              name="desiredSize"
              maxLength={50}
              placeholder="Если уже определились"
            />
          </label>
          {baseItem.parentSlug === "forged" ? (
            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span className={styles.label}>Исполнение</span>
              <input
                className={styles.control}
                name="finish"
                maxLength={80}
                defaultValue={finish}
              />
            </label>
          ) : null}
        </div>
      </details>

      <button
        className={`btn-accent ${styles.submit}`}
        type="submit"
        disabled={needsVariant && !selected}
      >
        Добавить в заявку
      </button>
      <p className={styles.disclaimer}>
        Это запрос на подбор, а не покупка: цена и совместимость подтверждаются специалистом.
      </p>
    </form>
  );
}