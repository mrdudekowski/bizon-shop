"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminSession } from "@/admin/domain/types";
import { Icon, type IconName } from "@/admin/ui/Icon";

import styles from "./AdminShell.module.css";
import { LoginScreen } from "@/admin/auth/LoginScreen";

const NAV = [
  { href: "/", label: "Шины", icon: "tires" },
  { href: "/wheels", label: "Диски", icon: "wheels" },
  { href: "/shop", label: "Shop", icon: "shop" },
  { href: "/pages", label: "Страницы", icon: "pages" },
  { href: "/materials", label: "Материалы", icon: "materials" },
] as const satisfies readonly { href: string; label: string; icon: IconName }[];

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
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const client = browserAdminClient();
    void client.getSession().then((next) => {
      setSession(next);
      return client.storageNotice();
    }).then((text) => {
      if (text != null) setNotice(text);
    }).catch(() => setSession(null)).finally(() => setAuthLoaded(true));
    const stopWarmup = warmAdminScreens(window.location.pathname);
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!document.querySelector('[data-unsaved="true"]')) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const handleExpiredSession = () => setSession(null);
    window.addEventListener("bizon-session-expired", handleExpiredSession);
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      stopWarmup();
      window.removeEventListener("bizon-session-expired", handleExpiredSession);
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, []);

  async function logOut() {
    try {
      await browserAdminClient().logout();
    } finally {
      setSession(null);
    }
  }

  if (!authLoaded) return <div className={styles.authLoading} role="status">Проверяем доступ…</div>;
  if (!session) return <LoginScreen onLogin={setSession} />;

  const role = session.role;
  const items = role === "admin" ? [...NAV, { href: "/users", label: "Пользователи", icon: "users" as const }] : [...NAV];

  return (
    <div className={styles.shell}>
      <div className={`${styles.body} ${collapsed ? styles.bodyCollapsed : ""}`}>
        <nav id="admin-nav" className={`${navOpen ? styles.navOpen : styles.nav} ${collapsed ? styles.navCollapsed : ""}`} aria-label="Разделы">
          <div className={styles.sidebarBrand}>
            <Link href="/" aria-label="BIZON — на главную" title="BIZON — на главную">
              <Image
                src={collapsed ? "/brand/bizon-mark-light.png" : "/brand/bizon-logo-light.png"}
                alt=""
                className={styles.fullMark}
                width={collapsed ? 96 : 300}
                height={collapsed ? 96 : 69}
                priority
                unoptimized
              />
            </Link>
          </div>
          <button className={styles.mobileCloseButton} type="button" onClick={() => setNavOpen(false)}>
            Закрыть меню
          </button>
          {items.map((item) => (
            <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} onClick={() => setNavOpen(false)} aria-current={isCurrent(pathname, item.href) ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <div className={styles.sidebarBottom}>
            <div className={styles.roles}>
              <span className={styles.avatar}><Icon name="users" size={18} /></span>
              <span className={styles.account}><strong>{session.login}</strong><small>{role === "admin" ? "Администратор" : "Редактор"}</small></span>
              <button className={styles.logout} type="button" onClick={() => void logOut()} aria-label="Выйти" title="Выйти">Выйти</button>
            </div>
          </div>
          <button
            className={styles.collapseButton}
            type="button"
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            aria-expanded={!collapsed}
            aria-controls="admin-nav"
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <Icon name="arrow" size={18} />
            <span>{collapsed ? "Развернуть" : "Свернуть меню"}</span>
          </button>
        </nav>
        <div className={styles.content}>
          <button className={styles.menuButton} type="button" aria-expanded={navOpen} aria-controls="admin-nav" onClick={() => { setNavOpen((open) => !open); setCollapsed(false); }}>
            Меню
          </button>
          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
