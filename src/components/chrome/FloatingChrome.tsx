"use client";

import type { MouseEventHandler, ReactNode, Ref } from "react";
import { useEffect, useRef, useState } from "react";

import BurgerToggle from "@/components/BurgerToggle/BurgerToggle";

import { nextChromeVisibility, type ChromeVisibility } from "./chromeVisibility";
import styles from "./FloatingChrome.module.css";
import { useAdaptiveChrome, type ChromeTone } from "./useAdaptiveChrome";

type FloatingChromeProps = {
  ariaLabel: string;
  menuOpen: boolean;
  onMenuToggle(open: boolean): void;
  brand: ReactNode;
  startNavigation?: ReactNode;
  navigation?: ReactNode;
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
  startNavigation,
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
  const [visibility, setVisibility] = useState<ChromeVisibility>("shown");
  const previousScroll = useRef(0);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const onScroll = () => {
      const scrollY = window.scrollY;
      setVisibility((current) => nextChromeVisibility(current, scrollY, previousScroll.current, mobile.matches));
      previousScroll.current = scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    mobile.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.chrome}
      data-tone={tone}
      data-visibility={visibility}
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
          {startNavigation ? <div className={styles.navigation}>{startNavigation}</div> : null}
        </div>
        <div className={styles.brand}>{brand}</div>
        <div className={styles.end}>
          {navigation ? <div className={styles.navigation}>{navigation}</div> : null}
          {utility ? <div className={styles.utility}>{utility}</div> : null}
          <div className={styles.action}>{action}</div>
        </div>
      </nav>
    </div>
  );
}
