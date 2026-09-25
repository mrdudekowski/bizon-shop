"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./BurgerMenu.module.css";
import { CatalogImage } from "@/components/catalog/CatalogImage";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { parseBulletPoints } from "@/utils/textUtils";

const BurgerMenu = ({ isOpen, onClose, menuItems = [] }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeId, setActiveId] = useState(menuItems[0]?.id ?? null);
  const [contentId, setContentId] = useState(menuItems[0]?.id ?? null);
  const [submenuView, setSubmenuView] = useState(false);
  const menuRef = useFocusTrap(isOpen);

  const activeContentItem = useMemo(
    () => menuItems.find((item) => item.id === contentId),
    [contentId, menuItems],
  );

  const showRightPane = !isMobile || submenuView;
  const showLeftPane = !isMobile || !submenuView;

  useEffect(() => {
    if (menuItems[0]?.id) {
      setActiveId(menuItems[0].id);
      setContentId(menuItems[0].id);
    }
  }, [menuItems]);

  useEffect(() => {
    if (!isOpen) {
      setSubmenuView(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleItemClick = (item) => {
    setActiveId(item.id);
    if (item.id !== "account") {
      setContentId(item.id);
    }
    if (!isMobile) return;
    if (item.id === "account") {
      setSubmenuView(false);
      return;
    }
    setSubmenuView(true);
  };

  const handleBack = () => {
    setSubmenuView(false);
  };

  return (
    <div
      id="burger-menu"
      className={`${styles.menuOverlay} ${isOpen ? styles.menuOpen : ""}`}
      aria-hidden={!isOpen}
    >
      <div
        className={styles.menuBackdrop}
        onClick={onClose}
        role="presentation"
      />

      <aside ref={menuRef} className={styles.menuPanel} role="dialog" aria-modal="true">
        <div className={styles.menuHeader}>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Закрыть меню"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.menuBody}>
          {showLeftPane && (
            <nav className={styles.leftPane} role="navigation">
              <ul className={styles.menuList}>
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.menuItem} ${
                        activeId === item.id ? styles.menuItemActive : ""
                      }`}
                      onClick={() => handleItemClick(item)}
                      aria-current={activeId === item.id ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      {item.hasSubmenu && (
                        <span className={styles.menuArrow} aria-hidden="true">
                          &gt;
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {showRightPane && (
            <section className={styles.rightPane}>
              {isMobile && submenuView && (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                >
                  ← Назад
                </button>
              )}

              <h2 className={styles.sectionTitle}>
                {activeContentItem?.label ?? "Раздел"}
              </h2>

              {activeContentItem?.hasSubmenu ? (
                <div className={styles.submenuContent}>
                  {activeContentItem.submenu?.map((submenuItem) => (
                    <Link
                      className={styles.submenuCard}
                      href={submenuItem.link}
                      key={submenuItem.id || submenuItem.name}
                      onClick={onClose}
                    >
                      {"image" in submenuItem && (
                        <div className={styles.submenuImage}>
                          <CatalogImage
                            src={submenuItem.imageUrl}
                            alt={submenuItem.name}
                            fill
                            sizes="120px"
                          />
                        </div>
                      )}
                      <div className={styles.submenuText}>
                        <span className={styles.submenuName}>
                          {submenuItem.name}
                        </span>
                        {submenuItem.type && (
                          <span className={styles.submenuMeta}>
                            {submenuItem.type}
                          </span>
                        )}
                        {submenuItem.description && (
                          <div className={styles.submenuDescription}>
                            {parseBulletPoints(submenuItem.description).map((item, index) => (
                              <span key={`${submenuItem.id || submenuItem.name}-${index}`} className={styles.descriptionItem}>
                                • {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : activeContentItem?.href ? (
                <Link
                  className={`${styles.submenuCard} ${styles.submenuCardSingle}`}
                  href={activeContentItem.href}
                  onClick={onClose}
                >
                  <div className={styles.submenuText}>
                    <span className={styles.submenuName}>{activeContentItem.label}</span>
                    <span className={styles.submenuDescription}>
                      Перейти в раздел
                    </span>
                  </div>
                </Link>
              ) : (
                <p className={styles.comingSoon}>Скоро будет доступно.</p>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
};

export default BurgerMenu;
