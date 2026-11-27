import { useState, type MouseEvent } from "react";
import type { TireCategory } from "@/lib/catalog/tireCategories";

import styles from "./TireApplicationIcons.module.css";

export function TireApplicationIcons({
  applications,
  variant = "icons",
}: {
  applications: readonly TireCategory[];
  variant?: "icons" | "labels";
}) {
  const [tooltipPlacements, setTooltipPlacements] = useState<Record<string, "top" | "right" | "left">>({});

  if (applications.length === 0) return null;

  const placeTooltipWithinViewport = (event: MouseEvent<HTMLSpanElement>, value: string) => {
    const tooltip = event.currentTarget.querySelector<HTMLElement>("[data-application-tooltip]");
    const item = event.currentTarget.getBoundingClientRect();
    const tooltipHeight = tooltip?.offsetHeight ?? 48;
    const tooltipWidth = tooltip?.offsetWidth ?? 240;
    const gap = 8;
    const wouldClipAbove = item.top - tooltipHeight - gap < 0;
    const wouldClipRight = item.right + tooltipWidth + gap > window.innerWidth;
    const placement = !wouldClipAbove ? "top" : wouldClipRight ? "left" : "right";

    setTooltipPlacements((current) => ({ ...current, [value]: placement }));
  };

  return (
    <span
      className={variant === "labels" ? styles.labels : styles.icons}
      role="list"
      aria-label="Применение шины"
    >
      {applications.map((application) => (
        <span
          className={variant === "labels" ? styles.labelItem : styles.iconItem}
          key={application.value}
          role="listitem"
          data-tooltip-placement={tooltipPlacements[application.value] ?? "top"}
          onMouseEnter={(event) => placeTooltipWithinViewport(event, application.value)}
        >
          {variant === "labels" ? <span>{application.name}</span> : null}
          <img
            className={styles.icon}
            src={application.icon}
            alt={variant === "icons" ? application.name : ""}
            width={24}
            height={24}
          />
          <span className={styles.tooltip} data-application-tooltip role="tooltip">
            {application.description}
          </span>
        </span>
      ))}
    </span>
  );
}
