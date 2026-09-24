import { TIRE_IQ_VISUALS } from "@/lib/content/tireIqVisuals";

import styles from "./TireIqVisualLibrary.module.css";

export function TireIqVisualLibrary() {
  return (
    <section className={styles.section} id="visuals" aria-labelledby="tire-iq-visuals-heading">
      <div className={styles.header}>
        <p className={styles.kicker}>Инженерная визуальная база</p>
        <h2 id="tire-iq-visuals-heading">Материалы Tire IQ</h2>
        <p>Схемы и визуальные основы для разбора осей, режимов работы, протектора и состояния шины.</p>
      </div>
      <div className={styles.grid}>
        {TIRE_IQ_VISUALS.map((visual) => (
          <article className={styles.card} key={visual.id}>
            <div className={styles.media}>
              <img src={visual.web} alt={visual.title} loading="lazy" width={1600} height={900} />
            </div>
            <div className={styles.meta}>
              <span>{visual.id}</span>
              <span>{visual.purpose}</span>
            </div>
            <h3>{visual.title}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
