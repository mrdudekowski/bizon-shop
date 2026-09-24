import Link from "next/link";

import type { HomeResumeContent } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function SelectionResumeCallout({ content }: { content: HomeResumeContent }) {
  return (
    <section className={styles.resume} data-main-chrome-tone="light">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p>{content.lead}</p>
        <div className={styles.actions}>
          <Link className="btn-accent" href={content.primaryCta.href}>
            {content.primaryCta.label}
          </Link>
          <Link className="btn-secondary" href={content.secondaryCta.href}>
            {content.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
