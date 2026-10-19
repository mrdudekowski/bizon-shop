"use client";

import { useState } from "react";

import styles from "./ShopHome.module.css";

type ShopOrderStep = {
  title: string;
  description: string;
};

export function ShopOrderSteps({ steps }: { steps: ShopOrderStep[] }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <div className={styles.orderSteps} aria-label="Как заказать кованые диски BIZON">
      {steps.map((step, index) => {
        const expanded = expandedStep === index;
        const descriptionId = `shop-order-step-description-${index}`;

        return (
          <article key={`${step.title}-${index}`} data-expanded={expanded}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{step.title}</h2>
            <button
              type="button"
              className={styles.stepDisclosure}
              aria-expanded={expanded}
              aria-controls={descriptionId}
              onClick={() => setExpandedStep(expanded ? null : index)}
            >
              {expanded ? "Скрыть" : "Подробнее"}
            </button>
            <p id={descriptionId}>{step.description}</p>
          </article>
        );
      })}
    </div>
  );
}
