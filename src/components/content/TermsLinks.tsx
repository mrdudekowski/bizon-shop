import Link from "next/link";

import { termsPages, type TermsPageKey, type TermsSurface } from "@/lib/content/termsPages";

import styles from "./TermsLinks.module.css";

export function TermsLinks({ surface, current }: { surface: TermsSurface; current?: TermsPageKey }) {
  return (
    <nav className={styles.termsLinks} aria-label="Условия">
      {termsPages(surface).map((page) =>
        page.key === current ? (
          <span key={page.key} aria-current="page">{page.label}</span>
        ) : (
          <Link key={page.key} href={page.href}>{page.label}</Link>
        ),
      )}
    </nav>
  );
}
