import { resolveAdvantageIcons } from "@/lib/catalog/featureImages";

import styles from "./AdvantageIcons.module.css";

export function AdvantageIcons({
  advantages,
  className,
  showCaptions = false,
}: {
  advantages: readonly { key: string; title?: string }[];
  className?: string;
  showCaptions?: boolean;
}) {
  const icons = resolveAdvantageIcons(advantages);
  if (icons.length === 0) return null;

  return (
    <span className={[styles.row, className].filter(Boolean).join(" ")}>
      {icons.map((icon, index) => (
        <span key={`${icon.key}-${index}`} className={styles.item}>
          <img className={styles.thumb} src={icon.src} alt={showCaptions ? "" : icon.label} width={40} height={40} />
          {showCaptions ? <span className={styles.caption}>{icon.label}</span> : null}
        </span>
      ))}
    </span>
  );
}
