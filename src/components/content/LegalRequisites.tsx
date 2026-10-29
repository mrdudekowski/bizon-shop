import type { SiteProfile } from "@/lib/content/siteProfile";

import styles from "./LegalRequisites.module.css";

export function LegalRequisites({ siteProfile }: { siteProfile: SiteProfile }) {
  if (!siteProfile.legalSummary.trim() && siteProfile.requisites.length === 0) {
    return null;
  }

  return (
    <section className={styles.root} aria-labelledby="legal-requisites-heading">
      <h2 id="legal-requisites-heading" className={styles.visuallyHidden}>
        Юридические реквизиты
      </h2>
      {siteProfile.legalSummary.trim() ? <p className={styles.summary}>{siteProfile.legalSummary}</p> : null}
      {siteProfile.requisites.length > 0 ? (
        <dl className={styles.list}>
          {siteProfile.requisites.map((requisite) => (
            <div key={requisite.id} className={styles.pair}>
              <dt className={styles.term}>{requisite.label}</dt>
              <dd className={styles.value}>{requisite.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
