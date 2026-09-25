"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminRole } from "@/admin/domain/types";
import { Icon, type IconName } from "@/admin/ui/Icon";

import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/", label: "Шины" },
  { href: "/tires/directions", label: "Направления" },
  { href: "/wheels", label: "Диски" },
  { href: "/shop", label: "Shop" },
  { href: "/pages", label: "Страницы" },
  { href: "/materials", label: "Материалы" },
] as const;

const NAV_ICONS = ["tires", "directions", "wheels", "shop", "pages", "materials", "users"] as const satisfies readonly IconName[];

// One request per screen module. Dynamic editors use a stand-in id so the module
// is compiled before the first real document is opened.
const ADMIN_SCREEN_ROUTES = [
  "/",
  "/tires/directions",
  "/tires/directions/dir-long-haul",
  "/tires/_",
  "/wheels",
  "/wheels/types/_",
  "/wheels/_",
  "/shop",
  "/shop/categories/_",
  "/shop/_",
  "/pages",
  "/pages/about",
  "/materials",
  "/materials/_",
  "/users",
] as const;

function warmAdminScreens(currentPath: string): () => void {
  if (process.env.NODE_ENV === "production") return () => {};
  let cancelled = false;
  const timer = window.setTimeout(() => {
    void (async () => {
      for (const href of ADMIN_SCREEN_ROUTES) {
        if (cancelled || href === currentPath) continue;
        try {
          await fetch(href);
        } catch {
          // The screen still opens from the menu if this warmup does not finish.
        }
      }
    })();
  }, 400);
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || (pathname.startsWith("/tires/") && !pathname.startsWith("/tires/directions"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<AdminRole>("editor");
  const [navOpen, setNavOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const client = browserAdminClient();
    void client.getSession().then((session) => setRole(session.role));
    void client.storageNotice().then((text) => {
      if (text != null) setNotice(text);
    });
    return warmAdminScreens(window.location.pathname);
  }, []);

  async function chooseRole(next: AdminRole) {
    await browserAdminClient().setSessionRole(next);
    setRole(next);
    window.dispatchEvent(new CustomEvent("bizon-role-change", { detail: next }));
  }

  const items = role === "admin" ? [...NAV, { href: "/users", label: "Пользователи" }] : [...NAV];

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <button className={styles.menuButton} type="button" aria-expanded={navOpen} aria-controls="admin-nav" onClick={() => setNavOpen((open) => !open)}>
            Меню
          </button>
          <Link href="/" className={styles.brand}>BIZON<small>УПРАВЛЕНИЕ КОНТЕНТОМ</small></Link>
        </div>
        <div className={styles.headerSide}>
          <p className={styles.breadcrumb}><span>Администрирование</span><Icon name="arrow" size={14} /><strong>{items.find((item) => isCurrent(pathname, item.href))?.label ?? "Документ"}</strong></p>
          <div className={styles.roles}><span className={styles.avatar}><Icon name="users" size={18} /></span><select aria-label="Роль" value={role} onChange={(event) => void chooseRole(event.target.value as AdminRole)}><option value="admin">Администратор</option><option value="editor">Редактор</option></select></div>
        </div>
      </header>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
      <div className={styles.body}>
        <nav id="admin-nav" className={navOpen ? styles.navOpen : styles.nav} aria-label="Разделы">
          <p className={styles.navLabel}>Рабочее пространство</p>
          {items.map((item, index) => (
            <Link key={item.href} href={item.href} onClick={() => setNavOpen(false)} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              <Icon name={NAV_ICONS[index]} />
              {item.label}
            </Link>
          ))}
          <p className={styles.navFoot}>BIZON · CMS<span>Локальный прототип</span></p>
        </nav>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
