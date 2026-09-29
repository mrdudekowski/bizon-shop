import Image from "next/image";
import Link from "next/link";

import { PREMIUM_MEDIA } from "@/constants/images";
import { ROUTES } from "@/constants/navigation";

import { HOME_SHOP_ZONE_ENTER_ID } from "./homeShopZone";
import styles from "./MainHome.module.css";

const OFFERS = [
  {
    title: "логотип",
    text: "Нанесение вашего логотипа на боковину.",
    image: PREMIUM_MEDIA.brandingLogo,
  },
  {
    title: "цветовые акценты",
    text: "Фирменные цвета и специальная маркировка.",
    image: PREMIUM_MEDIA.brandingColorAccents,
  },
  {
    title: "уникальные надписи",
    text: "Обозначения серии и технические метки.",
    image: PREMIUM_MEDIA.brandingInscriptions,
  },
];

export function BrandingCampaign() {
  return (
    <section
      id={HOME_SHOP_ZONE_ENTER_ID}
      className={`section section--dark ${styles.branding}`}
      data-main-chrome-tone="dark"
      aria-labelledby="branding-heading"
    >
      <div className={styles.brandingMedia} aria-hidden="true">
        <Image
          src={PREMIUM_MEDIA.branding}
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className={styles.brandingOverlay} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.brandingHero}>
          <div className={styles.brandingCopy}>
            <h2 id="branding-heading">
              Брендирование
              <br />
              шин
            </h2>
            <p>
              Нанесение логотипа, цветовых решений и специальных маркировок под ваш бренд.
              Решения для автопарков и крупных проектов.
            </p>
            <Link className="btn-accent" href={ROUTES.branding}>
              Узнать больше <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={styles.brandingOffers}>
            {OFFERS.map((offer) => (
              <Link key={offer.title} className={styles.brandingOffer} href={ROUTES.branding}>
                {offer.image ? (
                  <span
                    className={[
                      styles.brandingOfferMedia,
                      offer.image === PREMIUM_MEDIA.brandingLogo ? styles.brandingOfferMediaLogo : "",
                      offer.image === PREMIUM_MEDIA.brandingInscriptions ? styles.brandingOfferMediaInscriptions : "",
                    ].filter(Boolean).join(" ")}
                    aria-hidden="true"
                  >
                    <Image src={offer.image} alt="" fill sizes="30rem" />
                  </span>
                ) : null}
                <span className={styles.brandingOfferCopy}>
                  <strong>{offer.title}</strong>
                  <span>{offer.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
