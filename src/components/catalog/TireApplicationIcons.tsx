import type { TireCategory } from "@/lib/catalog/tireCategories";

import styles from "./TireApplicationIcons.module.css";

export function TireApplicationIcons({
  applications,
  variant = "icons",
}: {
  applications: readonly TireCategory[];
  variant?: "icons" | "labels";
}) {
  if (applications.length === 0) return null;

  return (
    <span
      className={variant === "labels" ? styles.labels : styles.icons}
      role="list"
      aria-label="Применение шины"
    >
      {applications.map((application) => (
        <span className={variant === "labels" ? styles.labelItem : styles.iconItem} key={application.value} role="listitem">
          {variant === "labels" ? <span>{application.name}</span> : null}
          <img
            className={styles.icon}
            src={application.icon}
            alt={variant === "icons" ? application.name : ""}
            title={application.name}
            width={24}
            height={24}
          />
        </span>
      ))}
    </span>
  );
}
