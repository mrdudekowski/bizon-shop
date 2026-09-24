import type { ReactNode } from "react";

import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/", label: "Шины" },
  { href: "/tires/directions", label: "Направления" },
  { href: "/wheels", label: "Диски" },
  { href: "/shop", label: "Shop" },
  { href: "/pages", label: "Страницы" },
  { href: "/materials", label: "Материалы" },
  { href: "/media", label: "Медиа" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>BIZON</p>
        <p className={styles.note}>Данные локальные</p>
      </header>
      <div className={styles.body}>
        <nav className={styles.nav} aria-label="Разделы">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
