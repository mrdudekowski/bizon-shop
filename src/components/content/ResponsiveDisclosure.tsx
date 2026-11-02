"use client";

import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";

import styles from "./ResponsiveDisclosure.module.css";

export function ResponsiveDisclosure({
  summary,
  children,
  className,
}: {
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setOpen(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function syncToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    setOpen(event.currentTarget.open);
  }

  return (
    <details className={`${styles.disclosure} ${className ?? ""}`} open={open} onToggle={syncToggle}>
      <summary>{summary}</summary>
      <div className={styles.content}>{children}</div>
    </details>
  );
}
