import { TIRE_IQ_VISUALS } from "@/lib/content/tireIqVisuals";

import styles from "./TireIqContextualVisuals.module.css";

const VISUALS_BY_ARTICLE: Record<string, { primary: string; comparison?: string[] }> = {
  "cold-inflation-pressure-check": { primary: "VIS-21", comparison: ["VIS-20", "VIS-22"] },
  "axle-role-in-tire-selection": { primary: "VIS-32", comparison: ["VIS-12", "VIS-13", "VIS-14"] },
  "uneven-tread-wear-first-checks": { primary: "VIS-33" },
  "how-to-read-tire-size-marking": { primary: "VIS-10" },
  "load-and-inflation-engineering-relationship": { primary: "VIS-30", comparison: ["VIS-32"] },
  "tire-lifecycle-inspection-basics": { primary: "VIS-35" },
  "drive-axle-tire-selection": { primary: "VIS-13", comparison: ["VIS-05"] },
  "dual-fitment-tire-check": { primary: "VIS-31" },
  "tbr-pre-trip-tire-inspection": { primary: "VIS-33" },
  "quarry-tbr-operating-conditions": { primary: "VIS-15", comparison: ["VIS-34"] },
  "construction-route-tire-check": { primary: "VIS-05", comparison: ["VIS-15", "VIS-34"] },
  "fleet-pressure-log-method": { primary: "VIS-21", comparison: ["VIS-20", "VIS-22"] },
  "tire-damage-escalation": { primary: "VIS-36", comparison: ["VIS-11"] },
};

export function TireIqContextualVisuals({ slug }: { slug: string }) {
  const assignment = VISUALS_BY_ARTICLE[slug];
  if (Array.isArray(assignment)) return null;
  const ids = assignment ? [assignment.primary, ...(assignment.comparison ?? [])] : [];
  const visuals = ids.map((id) => TIRE_IQ_VISUALS.find((visual) => visual.id === id)).filter(Boolean);
  if (!visuals.length) return null;

  return (
    <section className={styles.section} aria-labelledby="article-visuals-heading">
      <p className={styles.kicker}>Визуальный разбор</p>
      <h2 id="article-visuals-heading">Одна идея — один визуальный якорь</h2>
      <p className={styles.description}>Основное изображение объясняет центральную мысль статьи. Сравнительные материалы добавлены только там, где они показывают изменение режима или альтернативу.</p>
      <div className={styles.grid}>
        {visuals.map((visual) => visual && (
          <figure className={styles.figure} key={visual.id}>
            <div className={styles.media}>
              <img src={visual.web} alt={visual.title} loading="lazy" width={1600} height={900} />
            </div>
            <figcaption><span>{visual.id}</span>{visual.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
