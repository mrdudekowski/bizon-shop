"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdvantageIcons } from "@/components/catalog/AdvantageIcons";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { DualPaneItem, DualPaneMenuData, DualPaneSection } from "@/lib/content/dualPaneMenuTypes";
import styles from "./DualPaneMenu.module.css";

type DualPaneMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  menu: DualPaneMenuData;
  context?: "main" | "shop";
  title?: string;
  homeHref?: string;
  homeLabel?: string;
  featuredItem?: { name: string; link: string } | null;
  cartItem?: { name: string; link: string } | null;
};

const MOBILE_MENU_QUERY = "(max-width: 768px)";
const PHONE_MENU_QUERY = "(max-width: 767px)";

function defaultOpenSectionId(sections: DualPaneSection[]) {
  return sections.some((section) => section.id === "models") ? "models" : null;
}

function isHeroCutout(src?: string | null) {
  return Boolean(src?.startsWith("/images/hero/"));
}

/** Close after the browser starts following the link (avoids focus-restore canceling nav). */
function closeAfterNavigate(onClose: () => void) {
  queueMicrotask(onClose);
}

function GalleryPane({
  items,
  footerLink,
  onNavigate,
}: {
  items: DualPaneItem[];
  footerLink?: DualPaneSection["footerLink"];
  onNavigate: () => void;
}) {
  return (
    <div className={styles.galleryPane}>
      <ul className={styles.galleryList}>
        {items.map((item) => {
          const cutout = isHeroCutout(item.imageUrl);
          const tireCard = Array.isArray(item.advantages);
          return (
          <li key={item.id}>
            <Link
              className={styles.galleryCard}
              href={item.href}
              data-tire={tireCard ? "" : undefined}
              onClick={onNavigate}
            >
              {tireCard ? (
                <span className={styles.galleryMeta}>
                  <span className={styles.galleryTitle}>{item.title}</span>
                  <AdvantageIcons
                    advantages={item.advantages ?? []}
                    className={styles.galleryIcons}
                    showCaptions
                  />
                </span>
              ) : (
                <span className={styles.galleryTitle}>{item.title}</span>
              )}
              <span className={styles.galleryMedia} data-cutout={cutout ? "" : undefined}>
                {cutout && item.imageUrl ? (
                  <Image
                    src={`${item.imageUrl}?v=cutout`}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 80vw, 280px"
                    className={styles.galleryImage}
                  />
                ) : (
                  <CatalogImage
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 80vw, 280px"
                    className={styles.galleryImage}
                  />
                )}
              </span>
              {tireCard || !item.pills?.length ? null : (
                <span className={styles.pillRow}>
                  {item.pills.map((pill) => (
                    <span key={pill} className={styles.pill}>
                      {pill}
                    </span>
                  ))}
                </span>
              )}
              {tireCard ? null : (
                <AdvantageIcons advantages={item.advantages ?? []} className={styles.galleryIcons} />
              )}
            </Link>
          </li>
          );
        })}
      </ul>
      {footerLink ? (
        <Link className={styles.paneFooterLink} href={footerLink.href} onClick={onNavigate}>
          {footerLink.label}
          <SiteArrow />
        </Link>
      ) : null}
    </div>
  );
}

function ListPane({
  items,
  footerLink,
  onNavigate,
  isCurrentLink,
}: {
  items: DualPaneItem[];
  footerLink?: DualPaneSection["footerLink"];
  onNavigate: () => void;
  isCurrentLink: (href: string) => boolean;
}) {
  return (
    <div className={styles.listPane}>
      <ul className={styles.listItems}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className={styles.listLink}
              href={item.href}
              aria-current={isCurrentLink(item.href) ? "page" : undefined}
              onClick={onNavigate}
            >
              <span>{item.title}</span>
              {item.description ? (
                <span className={styles.listMeta}>{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      {footerLink ? (
        <Link className={styles.paneFooterLink} href={footerLink.href} onClick={onNavigate}>
          {footerLink.label}
          <SiteArrow />
        </Link>
      ) : null}
    </div>
  );
}

export function DualPaneMenu({
  isOpen,
  onClose,
  menu,
  context = "main",
  title = "Меню сайта",
  homeHref = "/",
  homeLabel = "BIZON",
  featuredItem = null,
  cartItem = null,
}: DualPaneMenuProps) {
  const menuRef = useFocusTrap(isOpen);
  const pathname = usePathname();
  const baseId = useId();
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"nav" | "pane">("nav");
  const [paneKey, setPaneKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  const sections = menu?.sections ?? [];
  const activeSection =
    activeSectionId == null
      ? null
      : (sections.find((section) => section.id === activeSectionId) ?? null);

  const handleLinkNavigate = () => closeAfterNavigate(onClose);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      const phone = window.matchMedia(PHONE_MENU_QUERY).matches;
      const stacked = window.matchMedia(MOBILE_MENU_QUERY).matches;
      const sectionId = phone ? null : defaultOpenSectionId(sections);
      setActiveSectionId(sectionId);
      setMobileView(sectionId && stacked ? "pane" : "nav");
      setPaneKey((key) => key + 1);
    }
  }

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MENU_QUERY);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (window.matchMedia(MOBILE_MENU_QUERY).matches && mobileView === "pane") {
        setMobileView("nav");
        return;
      }
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, mobileView]);

  const isCurrentLink = (href: string) => {
    const hrefPath = href.split("?")[0]?.split("#")[0] ?? href;
    return hrefPath === "/"
      ? pathname === hrefPath
      : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  const selectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setPaneKey((key) => key + 1);
    setMobileView("pane");
  };

  const leftPaneInert = isMobile && mobileView === "pane" ? true : undefined;
  const rightPaneInert = isMobile && mobileView === "nav" ? true : undefined;

  const renderPane = () => {
    if (!activeSection) return null;
    if (activeSection.pane === "gallery") {
      return (
        <GalleryPane
          items={activeSection.items}
          footerLink={activeSection.footerLink}
          onNavigate={handleLinkNavigate}
        />
      );
    }
    return (
      <ListPane
        items={activeSection.items}
        footerLink={activeSection.footerLink}
        onNavigate={handleLinkNavigate}
        isCurrentLink={isCurrentLink}
      />
    );
  };

  return (
    <div
      id="burger-menu"
      className={`${styles.menuOverlay} ${isOpen ? styles.menuOpen : ""}`}
      aria-hidden={!isOpen}
      inert={isOpen ? undefined : true}
      data-menu-context={context}
      data-mobile-view={mobileView}
      data-has-section={activeSection ? "true" : "false"}
    >
      <div className={styles.menuBackdrop} onClick={onClose} role="presentation" />

      <div
        className={styles.menuShell}
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <aside className={styles.menuPanel}>
          <div className={styles.menuHeader}>
            <Link
              className={styles.menuBrand}
              href={homeHref}
              onClick={handleLinkNavigate}
              translate="no"
            >
              {homeLabel}
            </Link>
            <button
              className={styles.closeButtonMobile}
              type="button"
              aria-label="Закрыть меню"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className={styles.menuBody}>
            {featuredItem ? (
              <Link
                className={styles.featuredLink}
                href={featuredItem.link}
                onClick={handleLinkNavigate}
              >
                <span>{featuredItem.name}</span>
                <SiteArrow />
              </Link>
            ) : null}

            {cartItem ? (
              <Link className={styles.cartLink} href={cartItem.link} onClick={handleLinkNavigate}>
                <span>
                  {cartItem.name}
                  <small>Единая заявка BIZON</small>
                </span>
                <SiteArrow />
              </Link>
            ) : null}

            <div className={styles.dualTrack}>
              <nav
                className={styles.leftPane}
                aria-label={title}
                inert={leftPaneInert}
              >
                <ul className={styles.sectionList}>
                  {sections.map((section) => {
                    const selected = section.id === activeSectionId;
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          className={`${styles.sectionButton} ${selected ? styles.sectionButtonActive : ""}`}
                          aria-pressed={selected}
                          aria-controls={`${baseId}-pane`}
                          onClick={() => selectSection(section.id)}
                        >
                          <span>{section.label}</span>
                          <span className={styles.sectionChevron} aria-hidden="true">
                            <SiteArrow />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div
                id={`${baseId}-pane`}
                className={styles.rightPane}
                aria-label={activeSection?.label}
                inert={rightPaneInert}
              >
                <div className={styles.rightPaneHeader}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setMobileView("nav")}
                  >
                    <SiteArrow direction="left" /> Назад
                  </button>
                  <h2 className={styles.rightPaneTitle}>{activeSection?.label}</h2>
                </div>
                <div key={paneKey} className={styles.rightPaneContent}>
                  {renderPane()}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <button
          className={styles.closeButtonDesktop}
          type="button"
          aria-label="Закрыть меню"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default DualPaneMenu;
