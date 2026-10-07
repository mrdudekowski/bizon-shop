"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { browserAdminClient } from "@/admin/client/localStore";
import type { AdminSession } from "@/admin/domain/types";
import { Icon, type IconName } from "@/admin/ui/Icon";
import { isMoreCurrent, isNavCurrent, profileInitials, splitNav } from "./mobileNav";

import styles from "./AdminShell.module.css";
import { LoginScreen } from "@/admin/auth/LoginScreen";

const CATALOG_NAV = [
  { href: "/", label: "Шины", icon: "tires" },
  { href: "/wheels", label: "Диски", icon: "wheels" },
  { href: "/shop", label: "Shop", icon: "shop" },
] as const satisfies readonly { href: string; label: string; icon: IconName }[];

const CONTENT_NAV = [
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
  "/media",
  "/publications",
  "/publications/_",
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const client = browserAdminClient();
    void client.getSession().then((next) => {
      setSession({ ...next, capabilities: next.capabilities ?? [] });
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

  useEffect(() => {
    setMoreOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen && !profileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen, profileOpen]);

  async function logOut() {
    try {
      await browserAdminClient().logout();
    } finally {
      setSession(null);
    }
  }

  if (!authLoaded) {
    return (
      <div className={styles.authLoading} role="status" aria-label="Проверяем доступ">
        <div className={styles.newtonsCradle} aria-hidden="true">
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>
    );
  }
  if (!session) return <LoginScreen onLogin={(next) => setSession({ ...next, capabilities: next.capabilities ?? [] })} />;

  const role = session.role;
  const capabilities = session.capabilities ?? [];
  const canEditPages = role === "admin" || capabilities.includes("edit_site_pages");
  const items = [
    ...CATALOG_NAV,
    ...(canEditPages ? CONTENT_NAV : []),
    ...(role === "admin"
      ? [
          { href: "/media", label: "Файлы", icon: "image" as const },
          { href: "/publications", label: "Публикации", icon: "publications" as const },
          { href: "/users", label: "Пользователи", icon: "users" as const },
        ]
      : []),
  ];
  const { primary, more } = splitNav(items);

  return (
    <div className={styles.shell}>
      <div className={`${styles.body} ${collapsed ? styles.bodyCollapsed : ""}`}>
        <nav id="admin-nav" className={`${styles.nav} ${collapsed ? styles.navCollapsed : ""}`} aria-label="Разделы">
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
          {items.map((item) => (
            <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={isNavCurrent(pathname, item.href) ? "page" : undefined}>
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
          {notice ? <p className={styles.notice}>{notice}</p> : null}
          {children}
        </div>

        <header className={styles.topbar}>
          <button
            className={styles.profileButton}
            type="button"
            aria-label={`Профиль ${session.login}`}
            aria-expanded={profileOpen}
            aria-controls="admin-profile-sheet"
            onClick={() => {
              setProfileOpen((open) => !open);
              setMoreOpen(false);
            }}
          >
            {profileInitials(session.login)}
          </button>
        </header>

        {profileOpen || moreOpen ? (
          <button
            className={styles.sheetBackdrop}
            type="button"
            data-open="true"
            aria-label="Закрыть"
            onClick={() => {
              setProfileOpen(false);
              setMoreOpen(false);
            }}
          />
        ) : null}

        <div
          id="admin-profile-sheet"
          className={styles.profileSheet}
          data-open={profileOpen ? "true" : undefined}
          hidden={!profileOpen}
          role="dialog"
          aria-label="Профиль"
        >
          <div>
            <strong>{session.login}</strong>
            <small>{role === "admin" ? "Администратор" : "Редактор"}</small>
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              void logOut();
            }}
          >
            Войти другим профилем
          </button>
          <button type="button" onClick={() => void logOut()}>
            Выйти
          </button>
        </div>

        <nav className={styles.tabbar} aria-label="Разделы">
          {primary.map((item) => (
            <Link
              key={item.href}
              className={styles.tab}
              href={item.href}
              aria-current={isNavCurrent(pathname, item.href) ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            className={styles.tab}
            type="button"
            aria-current={isMoreCurrent(pathname, more) ? "page" : undefined}
            aria-expanded={moreOpen}
            aria-controls="admin-more-sheet"
            onClick={() => {
              setMoreOpen((open) => !open);
              setProfileOpen(false);
            }}
          >
            <Icon name="more" />
            <span>Прочее</span>
          </button>
        </nav>

        <div
          id="admin-more-sheet"
          className={styles.moreSheet}
          data-open={moreOpen ? "true" : undefined}
          hidden={!moreOpen}
          role="dialog"
          aria-label="Прочее"
        >
          {more.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isNavCurrent(pathname, item.href) ? "page" : undefined}
              onClick={() => setMoreOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
