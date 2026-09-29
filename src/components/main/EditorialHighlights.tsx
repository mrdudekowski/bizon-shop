import Image from "next/image";
import Link from "next/link";

import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";
import type { PageShell } from "@/lib/content/pages/types";

import styles from "./MainHome.module.css";

export function EditorialHighlights({ content }: { content: PageShell }) {
  return (
    <div className={styles.editorial}>
      <div className={styles.inner}>
        <div className={styles.expertiseSplit}>
          <div className={styles.expertiseMedia}>
            <Image
              src={PREMIUM_MEDIA.inspection}
              alt="Замер глубины протектора грузовой шины"
              fill
              sizes="(max-width: 767px) 100vw, 40vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
          <div className={styles.expertiseCopy}>
            <h2 id="expertise-support-title">{content.title}</h2>
            <p>{content.lead}</p>
            <Link className={`btn-accent ${styles.expertiseCta}`} href={ROUTES.tireIq}>
              Открыть Tire IQ <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
