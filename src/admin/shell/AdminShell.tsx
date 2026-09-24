"use client";

import { useEffect, useState, type ReactNode } from "react";

import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole } from "@/admin/domain/types";

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
  const [role, setRole] = useState<AdminRole>("admin");
  const [navOpen, setNavOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const client = browserAdminClient();
    void client.getSession().then((session) => setRole(session.role));
    void client.storageNotice().then((text) => {
      if (text != null) setNotice(text);
    });
  }, []);

  async function chooseRole(next: AdminRole) {
    await browserAdminClient().setSessionRole(next);
    setRole(next);
  }

  const items = role === "admin" ? [...NAV, { href: "/users", label: "Пользователи" }] : [...NAV];

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <button className={styles.menuButton} type="button" onClick={() => setNavOpen((open) => !open)}>
            Меню
          </button>
          <p className={styles.brand}>BIZON</p>
        </div>
        <div className={styles.headerSide}>
          <div className={styles.roles} role="group" aria-label="Роль">
            <button type="button" aria-pressed={role === "admin"} onClick={() => void chooseRole("admin")}>
              Администратор
            </button>
            <button type="button" aria-pressed={role === "editor"} onClick={() => void chooseRole("editor")}>
              Редактор
            </button>
          </div>
          <p className={styles.note}>Данные локальные</p>
        </div>
      </header>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
      <div className={styles.body}>
        <nav className={navOpen ? styles.navOpen : styles.nav} aria-label="Разделы">
          {items.map((item) => (
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
