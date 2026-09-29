import Image from "next/image";
import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function EditorialHighlights({ content }: { content: PageShell }) {
  return (
    <div className={styles.editorial}>
      <div className={styles.expertiseBanner}>
        <Image
          className={styles.expertiseBannerImage}
          src={PREMIUM_MEDIA.inspection}
          alt="Специалист измеряет глубину протектора грузовой шины"
          fill
          sizes="100vw"
          priority={false}
        />
        <div className={styles.expertiseBannerContent}>
          <p className={styles.expertiseBannerEyebrow}>TIRE IQ · {content.eyebrow}</p>
          <h2 id="expertise-support-title">{content.title}</h2>
          <p className={styles.expertiseBannerLead}>{content.lead}</p>
          <Link className={`btn-accent ${styles.expertiseCta}`} href={ROUTES.tireIq}>
            Перейти к материалам <SiteArrow />
          </Link>
        </div>
        <span className={styles.expertiseBannerMark} aria-hidden="true">BIZON · TIRE IQ</span>
      </div>
    </div>
  );
}
