"use client";

import type { FormEvent } from "react";
import { requestOpenCart } from "@/lib/cart/cartStorage";
import { useCart } from "@/hooks/useCart";
import type { ForgedWheelView } from "./forgedView";
import styles from "./ForgedConfigurator.module.css";

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function configurationKey(vehicle: string, year: string): string {
  const normalized = `${vehicle}-${year}`
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return normalized || "vehicle";
}

export function ForgedConfigurator({ model }: { model: ForgedWheelView }) {
  const cart = useCart();
  const maxYear = new Date().getFullYear() + 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const vehicle = value(formData, "vehicle");
    const year = value(formData, "year");
    const currentSize = value(formData, "currentSize");
    const desiredSize = value(formData, "desiredSize");
    const finish = value(formData, "finish");
    const quantity = Math.min(Math.max(Number(formData.get("quantity")) || 4, 1), 8);
    const variantLabel = `${vehicle}, ${year}`;
    const notes = [
      `Автомобиль: ${variantLabel}`,
      currentSize ? `Текущий размер: ${currentSize}` : "",
      desiredSize ? `Желаемый размер: ${desiredSize}` : "",
      finish ? `Исполнение: ${finish}` : "",
    ].filter(Boolean).join("; ");

    cart.addItem({
      itemType: "wheel",
      itemId: model.id,
      variantId: configurationKey(vehicle, year),
      name: model.name,
      slug: model.slug,
      parentSlug: "forged",
      quantity,
      priceOnRequest: true,
      url: `/shop/wheels/forged/${model.slug}`,
      variantLabel,
      notes,
    });
    requestOpenCart();
  }

  return (
    <form id="wheel-request" className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHead}>
        <div>
          <p>Конфигурация для расчёта</p>
          <h3>{model.name}</h3>
        </div>
        <span>Цена и совместимость подтверждаются специалистом</span>
      </div>

      <div className={styles.grid}>
        <label>
          <span>Автомобиль *</span>
          <input
            name="vehicle"
            required
            maxLength={120}
            placeholder="Марка и модель"
            autoComplete="off"
          />
        </label>
        <label>
          <span>Год выпуска *</span>
          <input
            name="year"
            type="number"
            required
            min={1950}
            max={maxYear}
            inputMode="numeric"
            placeholder="2024"
          />
        </label>
        <label>
          <span>Текущий размер колёс</span>
          <input name="currentSize" maxLength={50} placeholder="Например, 265/65 R17" />
        </label>
        <label>
          <span>Желаемый размер</span>
          <input name="desiredSize" maxLength={50} placeholder="Если уже определились" />
        </label>
        <label>
          <span>Исполнение</span>
          <input name="finish" maxLength={80} defaultValue={model.finish} />
        </label>
        <label>
          <span>Количество дисков</span>
          <input name="quantity" type="number" min={1} max={8} defaultValue={4} inputMode="numeric" />
        </label>
      </div>

      <div className={styles.submitRow}>
        <button type="submit">Добавить в заявку</button>
        <p>Отправка заявки не является покупкой и не фиксирует стоимость.</p>
      </div>
    </form>
  );
}
