"use client";

import type { MouseEventHandler, ReactNode, Ref } from "react";

import BurgerToggle from "@/components/BurgerToggle/BurgerToggle";

import styles from "./FloatingChrome.module.css";
import { useAdaptiveChrome, type ChromeTone } from "./useAdaptiveChrome";

type FloatingChromeProps = {
  ariaLabel: string;
  menuOpen: boolean;
  onMenuToggle(open: boolean): void;
  brand: ReactNode;
  navigation: ReactNode;
  utility?: ReactNode;
  action?: ReactNode;
  toneAttribute: string;
  fallbackTone: ChromeTone;
  surface: "main" | "shop";
  rootRef?: Ref<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
};

export function ChromeWordmark() {
  return (
    <span className={styles.wordmark}>
      <img
        data-on="light"
        src="/brand/logo-navbar-black.png"
        alt=""
        width={300}
        height={69}
      />
      <img
        data-on="dark"
        src="/brand/logo-navbar-white.png"
        alt=""
        width={300}
        height={69}
      />
    </span>
  );
}

export function FloatingChrome({
  ariaLabel,
  menuOpen,
  onMenuToggle,
  brand,
  navigation,
  utility,
  action,
  toneAttribute,
  fallbackTone,
  surface,
  rootRef,
  onMouseLeave,
}: FloatingChromeProps) {
  const { tone } = useAdaptiveChrome(toneAttribute, fallbackTone);

  return (
    <div
      ref={rootRef}
      className={styles.chrome}
      data-tone={tone}
      data-main-chrome={surface === "main" ? "" : undefined}
      data-shop-chrome={surface === "shop" ? "" : undefined}
      onMouseLeave={onMouseLeave}
    >
      <nav className={styles.bar} aria-label={ariaLabel}>
        <div className={styles.start}>
          <div className={styles.burgerButton}>
            <BurgerToggle
              isOpen={menuOpen}
              onToggle={onMenuToggle}
              inverted={tone === "dark"}
            />
          </div>
        </div>
        <div className={styles.brand}>{brand}</div>
        <div className={styles.end}>
          <div className={styles.navigation}>{navigation}</div>
          {utility ? <div className={styles.utility}>{utility}</div> : null}
          <div className={styles.action}>{action}</div>
        </div>
      </nav>
    </div>
  );
}
