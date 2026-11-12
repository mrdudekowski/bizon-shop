import styles from "./ChromeNavIcon.module.css";

export type ChromeNavIconName = "catalog" | "compass" | "disk" | "delivery" | "home";

type ChromeNavIconProps = {
  name: ChromeNavIconName;
};

export function ChromeNavIcon({ name }: ChromeNavIconProps) {
  return <span className={styles.icon} data-icon={name} aria-hidden="true" />;
}
