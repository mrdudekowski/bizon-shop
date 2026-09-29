import styles from "./SiteArrow.module.css";

type SiteArrowProps = {
  className?: string;
  direction?: "right" | "left" | "ne";
};

export function SiteArrow({ className, direction = "right" }: SiteArrowProps) {
  return (
    <span
      className={[styles.arrow, styles[direction], className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
