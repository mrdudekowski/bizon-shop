"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { requestOpenCart } from "@/lib/cart/cartStorage";
import { useCart } from "@/hooks/useCart";
import { CustomSelect } from "@/components/ui/CustomSelect";
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
  available?: boolean;
  finish?: string;
  className?: string;
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

const NOTES_LIMIT = 300;
const BEADLOCK_ON = "С бедлоком";
const BEADLOCK_OFF = "Без бедлока";

export function buildWheelOrderLine(input: {
  withBeadlock: boolean;
  selectedId?: string;
  price?: number;
  priceOnRequest: boolean;
  fitment: string[];
  detailNotes: string[];
}): { notes: string; variantId?: string; price?: number; priceOnRequest: boolean } {
  const phrase = input.withBeadlock ? BEADLOCK_ON : BEADLOCK_OFF;
  const details = input.detailNotes.filter(Boolean);
  const appended = [...details, phrase].join("; ");
  // ponytail: notes are stored at 300 characters, so a long fitment note would cut a trailing phrase
  const notes = appended.length <= NOTES_LIMIT ? appended : [phrase, ...details].join("; ").slice(0, NOTES_LIMIT);
  return {
    notes,
    variantId: wheelOrderVariantId(input.selectedId, input.fitment, input.withBeadlock),
    price: input.price,
    priceOnRequest: input.priceOnRequest,
  };
}

function wheelOrderVariantId(selectedId: string | undefined, fitment: string[], withBeadlock: boolean): string | undefined {
  const flag = withBeadlock ? "с-бедлоком" : "без-бедлока";
  if (fitment.some(Boolean)) return configurationKey([flag, selectedId ?? "без-размера", ...fitment]);
  if (!selectedId) return withBeadlock ? flag : undefined;
  return withBeadlock ? `${selectedId}-${flag}` : selectedId;
}

export function WheelOrderPanel({ baseItem, variants, available = false, finish = "", className }: WheelOrderPanelProps) {
  const cart = useCart("shop");
  const [variantId, setVariantId] = useState(variants.length === 1 ? variants[0].id : "");
  const maxQuantity = baseItem.parentSlug === "forged" ? 8 : 999;
  const [quantity, setQuantity] = useState(baseItem.parentSlug === "forged" ? 4 : 1);
  const [withBeadlock, setWithBeadlock] = useState(false);
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
    const fitmentValues = [vehicle, year, currentSize, desiredSize, selectedFinish];
    const line = buildWheelOrderLine({
      withBeadlock,
      selectedId: selected?.id,
      price: selected?.price,
      priceOnRequest: selected == null || selected.priceOnRequest || selected.price == null,
      fitment: fitmentValues,
      detailNotes: [
        vehicleLabel ? `Автомобиль: ${vehicleLabel}` : "",
        currentSize ? `Текущий размер: ${currentSize}` : "",
        desiredSize ? `Желаемый размер: ${desiredSize}` : "",
        selectedFinish ? `Исполнение: ${selectedFinish}` : "",
      ],
    });
    const variantLabel = [selected?.label, vehicleLabel].filter(Boolean).join(" · ");

    cart.addItem({
      ...baseItem,
      variantId: line.variantId,
      variantLabel: variantLabel || undefined,
      quantity,
      price: line.price,
      priceOnRequest: line.priceOnRequest,
      notes: line.notes,
    });
    requestOpenCart("shop");
  }

  return (
    <form className={`${styles.panel} ${className ?? ""}`} onSubmit={handleSubmit} aria-labelledby="wheel-order-heading">
      <div className={styles.heading}>
        <h2 id="wheel-order-heading">Заявка на подбор</h2>
        <p>Специалист проверит совместимость и уточнит стоимость.</p>
      </div>

      <div className={styles.sizeRow}>
        {variants.length > 0 ? (
          <label className={styles.field}>
            <span className={styles.label}>Размер и параметры</span>
            <CustomSelect
              className={styles.control}
              value={variantId}
              onValueChange={setVariantId}
              required
              options={[{ value: "", label: "Выберите размер" }, ...variants.map((variant) => ({ value: variant.id, label: variant.label }))]}
            />
          </label>
        ) : (
          <p className={styles.hint}>Размеры уточняются — специалист поможет подобрать конфигурацию.</p>
        )}
        <label className={styles.beadlock}>
          <span className={styles.label}>Бедлок</span>
          <span className={styles.switch}>
            <input
              className={styles.yep}
              type="checkbox"
              role="switch"
              checked={withBeadlock}
              onChange={(event) => setWithBeadlock(event.target.checked)}
            />
            <span className={styles.slider} />
          </span>
        </label>
      </div>

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

      <div className="action-row">
        <button
          className={`btn-accent ${styles.submit}`}
          type="submit"
          disabled={needsVariant && !selected}
        >
          Добавить в заявку
        </button>
        <span
          className="availability-badge"
          data-status={available ? "in-stock" : "on-order"}
        >
          {available ? "В наличии" : "Под заказ"}
        </span>
      </div>
    </form>
  );
}
