"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./TireIqAxleSelector.module.css";

const AXLES = [
  {
    key: "steer",
    number: "01",
    title: "Рулевая ось",
    description: "Управление, курсовая устойчивость и равномерный контакт с дорогой.",
  },
  {
    key: "drive",
    number: "02",
    title: "Ведущая ось",
    description: "Передача тяги и работа под нагрузкой в выбранном режиме эксплуатации.",
  },
  {
    key: "trailer",
    number: "03",
    title: "Прицепная ось",
    description: "Стабильность прицепа, распределение нагрузки и контроль износа.",
  },
] as const;

export function TireIqAxleSelector({ hasKnowledge = true }: { hasKnowledge?: boolean }) {
  const [activeAxle, setActiveAxle] = useState<(typeof AXLES)[number]["key"] | null>(null);
  const imageName = activeAxle ? `${activeAxle}-active` : "neutral";

  return (
    <section className={styles.section} aria-labelledby="axle-selector-heading">
      <div className={styles.intro}>
        <p className={styles.kicker}>Точка выбора</p>
        <h2 id="axle-selector-heading">Начните с оси</h2>
        <p>
          Роль оси задаёт контекст для разговора о шине. Выберите её, чтобы
          перейти к соответствующим материалам Tire IQ.
        </p>
        <div className={styles.visual}>
          <img
            src={`/images/tire-iq/axles/VIS-01_${imageName}.svg`}
            alt="Грузовой автопоезд с выделенной осевой группой"
            width={2048}
            height={682}
          />
        </div>
      </div>
      <div className={styles.options}>
        {AXLES.map((axle) => (
          <Link
            className={styles.option}
            href={hasKnowledge ? "/tire-iq#knowledge" : "/contact"}
            key={axle.key}
            data-tire-iq-axle={axle.key}
            onMouseEnter={() => setActiveAxle(axle.key)}
            onMouseLeave={() => setActiveAxle(null)}
            onFocus={() => setActiveAxle(axle.key)}
            onBlur={() => setActiveAxle(null)}
          >
            <span className={styles.number}>{axle.number}</span>
            <span className={styles.content}>
              <strong>{axle.title}</strong>
              <span>{axle.description}</span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
      <p className={styles.note}>
        Это образовательный контекст, а не подтверждение совместимости конкретной модели.
        Для проверки задачи <Link href="/contact">свяжитесь со специалистом</Link>.
      </p>
    </section>
  );
}
