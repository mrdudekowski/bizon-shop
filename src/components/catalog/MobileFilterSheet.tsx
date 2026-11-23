"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import styles from "./MobileFilterSheet.module.css";

type MobileFilterSheetProps = {
  title: string;
  triggerLabel: string;
  activeCount: number;
  resultCount: string;
  onReset: () => void;
  formLabel: string;
  children: ReactNode;
};

export function MobileFilterSheet({
  title,
  triggerLabel,
  activeCount,
  onReset,
  resultCount,
  formLabel,
  children,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      requestAnimationFrame(() => trigger?.focus());
    };
  }, [open]);

  return (
    <div className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Закрыть фильтры"
            onClick={() => setOpen(false)}
          />
          <section
            ref={sheetRef}
            id={id}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
          >
            <header className={styles.header}>
              <h2 id={`${id}-title`}>{title}</h2>
              <button
                ref={closeRef}
                type="button"
                className={styles.close}
                aria-label="Закрыть фильтры"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>
            <div className={styles.form} role="group" aria-label={formLabel}>
              <div className={styles.fields}>{children}</div>
              <footer className={styles.actions}>
                <span className={styles.resultCount} aria-live="polite">Найдено: {resultCount}</span>
                <button type="button" className={styles.reset} onClick={onReset}>Сбросить</button>
              </footer>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
