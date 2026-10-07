import Link from "next/link";

import { SiteArrow } from "@/components/SiteArrow/SiteArrow";
import { ROUTES } from "@/constants/navigation";

import { BrandingCompare } from "./BrandingCompare";
import { HOME_SHOP_ZONE_ENTER_ID } from "./homeShopZone";
import styles from "./MainHome.module.css";

export function BrandingCampaign() {
  return (
    <section
      id={HOME_SHOP_ZONE_ENTER_ID}
      className={`section section--dark ${styles.branding}`}
      data-main-chrome-tone="dark"
      aria-labelledby="branding-heading"
    >
      <BrandingCompare />
      <div className={styles.brandingOverlay} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.brandingCopy}>
          <h2 id="branding-heading">
            Ваш бренд
            <br />
            на шинах
          </h2>
          <p>
            Ваш бренд на шинах. Больше узнаваемости, сильнее присутствие, единый
            индустриальный стиль.
          </p>
          <Link
            className={`btn-accent ${styles.brandingCta}`}
            href={`${ROUTES.contact}?subject=branding`}
          >
            Обсудить проект <SiteArrow />
          </Link>
        </div>
        <div className={styles.brandingCaptions} aria-hidden="true">
          <span className={styles.brandingCaption}>Стандартный</span>
          <span className={styles.brandingCaptionAfter}>Брендированный</span>
        </div>
      </div>
    </section>
  );
}
