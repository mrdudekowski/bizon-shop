"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./TireIqBusSelector.module.css";

const AXLES = [
  { key: "steer", number: "01", title: "Рулевая ось", description: "Управление и равномерный контакт с дорогой." },
  { key: "drive", number: "02", title: "Ведущая ось", description: "Передача тяги и работа под нагрузкой." },
] as const;

export function TireIqBusSelector({ hasKnowledge = true }: { hasKnowledge?: boolean }) {
  const [activeAxle, setActiveAxle] = useState<(typeof AXLES)[number]["key"] | null>(null);
  const imageName = activeAxle ? `${activeAxle}-active` : "neutral";

  return (
    <section className={styles.section} aria-labelledby="bus-selector-heading">
      <div className={styles.intro}>
        <p className={styles.kicker}>Третья конфигурация</p>
        <h2 id="bus-selector-heading">Автобус</h2>
        <p>Оцените роль оси при эксплуатации междугороднего автобуса и подборе шин.</p>
        <div className={styles.visual}>
          <img src={`/images/tire-iq/axles/VIS-03_${imageName}.svg`} alt="Междугородний автобус с выделенной осью" width={2400} height={1000} />
        </div>
      </div>
      <div className={styles.options}>
        {AXLES.map((axle) => (
          <Link className={styles.option} href={hasKnowledge ? "/tire-iq#knowledge" : "/contact"} key={axle.key}
            onMouseEnter={() => setActiveAxle(axle.key)} onMouseLeave={() => setActiveAxle(null)}
            onFocus={() => setActiveAxle(axle.key)} onBlur={() => setActiveAxle(null)}>
            <span className={styles.number}>{axle.number}</span>
            <span className={styles.content}><strong>{axle.title}</strong><span>{axle.description}</span></span>
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
